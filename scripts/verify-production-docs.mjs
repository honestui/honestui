const configuredBaseUrl = process.argv[2] ?? process.env.DOCS_BASE_URL ?? "http://localhost:3000"
const baseUrl = new URL(configuredBaseUrl)
const failures = []
const responseCache = new Map()

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
}

function getTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => match[0])
}

function getAttribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1]
}

function getTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i)
  return match ? decodeHtml(match[1].trim()) : ""
}

async function fetchResult(input) {
  const url = new URL(input, baseUrl)
  const key = url.href

  if (!responseCache.has(key)) {
    responseCache.set(
      key,
      fetch(url, { redirect: "follow" }).then(async (response) => ({
        contentType: response.headers.get("content-type") ?? "",
        status: response.status,
        text: await response.text(),
        url: response.url,
      })),
    )
  }

  return responseCache.get(key)
}

async function mapWithConcurrency(items, concurrency, task) {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (item !== undefined) await task(item)
    }
  })

  await Promise.all(workers)
}

let sitemap
try {
  sitemap = await fetchResult("/sitemap.xml")
} catch (error) {
  console.error(`Could not reach ${baseUrl.href}: ${error instanceof Error ? error.message : error}`)
  process.exit(1)
}

if (sitemap.status !== 200) {
  console.error(`Sitemap returned ${sitemap.status} at ${new URL("/sitemap.xml", baseUrl).href}`)
  process.exit(1)
}

const canonicalUrls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
  decodeHtml(match[1])
)
const titleOwners = new Map()
const internalPaths = new Set()
const markdownAlternates = new Set()

await mapWithConcurrency(canonicalUrls, 12, async (canonicalUrl) => {
  const canonical = new URL(canonicalUrl)
  const result = await fetchResult(canonical.pathname)
  const location = canonical.pathname

  if (result.status !== 200) {
    failures.push(`${location}: returned ${result.status}`)
    return
  }

  const htmlTag = getTags(result.text, "html")[0] ?? ""
  if (getAttribute(htmlTag, "lang") !== "en") {
    failures.push(`${location}: expected html lang="en"`)
  }

  const title = getTitle(result.text)
  if (!title) {
    failures.push(`${location}: missing title`)
  } else if (titleOwners.has(title)) {
    failures.push(`${location}: duplicate title "${title}" also used by ${titleOwners.get(title)}`)
  } else {
    titleOwners.set(title, location)
  }

  const metaDescription = getTags(result.text, "meta")
    .find((tag) => getAttribute(tag, "name") === "description")
  if (!metaDescription || !getAttribute(metaDescription, "content")) {
    failures.push(`${location}: missing meta description`)
  }

  const canonicalTag = getTags(result.text, "link")
    .find((tag) => getAttribute(tag, "rel") === "canonical")
  const renderedCanonical = canonicalTag ? getAttribute(canonicalTag, "href") : undefined
  if (renderedCanonical !== canonicalUrl) {
    failures.push(`${location}: canonical is ${renderedCanonical ?? "missing"}; expected ${canonicalUrl}`)
  }

  const h1Count = (result.text.match(/<h1(?:\s|>)/gi) ?? []).length
  if (h1Count !== 1) failures.push(`${location}: expected one h1, found ${h1Count}`)

  const mainCount = (result.text.match(/<main(?:\s|>)/gi) ?? []).length
  if (mainCount !== 1) failures.push(`${location}: expected one main landmark, found ${mainCount}`)

  if (getTags(result.text, "nav").length === 0) {
    failures.push(`${location}: missing navigation landmark`)
  }

  if (location.startsWith("/docs")) {
    if (!result.text.includes('href="#docs-main-content"')) {
      failures.push(`${location}: missing skip link to documentation content`)
    }

    if (!result.text.includes('id="docs-main-content"')) {
      failures.push(`${location}: missing documentation main-content target`)
    }
  }

  for (const anchor of getTags(result.text, "a")) {
    const href = getAttribute(anchor, "href")
    if (!href) continue

    const destination = new URL(href, canonicalUrl)
    if (destination.origin === canonical.origin && destination.pathname.startsWith("/docs")) {
      internalPaths.add(destination.pathname)
    }
  }

  const markdownAlternate = getTags(result.text, "link").find(
    (tag) =>
      getAttribute(tag, "rel") === "alternate" &&
      getAttribute(tag, "type") === "text/markdown",
  )
  const markdownHref = markdownAlternate ? getAttribute(markdownAlternate, "href") : undefined
  if (markdownHref) markdownAlternates.add(new URL(markdownHref, canonicalUrl).pathname)
})

await mapWithConcurrency(internalPaths, 12, async (pathname) => {
  const result = await fetchResult(pathname)
  if (result.status >= 400) failures.push(`${pathname}: internal documentation link returned ${result.status}`)
})

await mapWithConcurrency(markdownAlternates, 12, async (pathname) => {
  const result = await fetchResult(pathname)
  if (result.status !== 200) {
    failures.push(`${pathname}: Markdown alternate returned ${result.status}`)
  } else if (!/^text\/(?:markdown|plain)\b/i.test(result.contentType)) {
    failures.push(`${pathname}: Markdown alternate returned ${result.contentType || "no content type"}`)
  }
})

const requiredAgentResources = [
  ["/llms.txt", /^text\/plain\b/i],
  ["/llms-full.txt", /^text\/plain\b/i],
  ["/skill.md", /^text\/markdown\b/i],
  ["/design.md", /^text\/markdown\b/i],
  ["/.well-known/agent-skills/honest-ui/SKILL.md", /^text\/markdown\b/i],
  ["/.well-known/agent-skills/index.json", /^application\/json\b/i],
]

await mapWithConcurrency(requiredAgentResources, 5, async ([pathname, expectedType]) => {
  const result = await fetchResult(pathname)
  if (result.status !== 200) {
    failures.push(`${pathname}: agent resource returned ${result.status}`)
  } else if (!expectedType.test(result.contentType)) {
    failures.push(`${pathname}: agent resource returned ${result.contentType || "no content type"}`)
  }
})

const llmsIndex = await fetchResult("/llms.txt")
if (llmsIndex.text.includes("/mcp")) {
  failures.push("/llms.txt: advertises an MCP integration that Honest UI does not provide")
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(
  `Validated ${canonicalUrls.length} production documentation routes, ${internalPaths.size} internal destinations, ${markdownAlternates.size} Markdown alternates, and ${requiredAgentResources.length} agent resources.`,
)
