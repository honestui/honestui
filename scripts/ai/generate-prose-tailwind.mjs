import { readFile, writeFile } from "node:fs/promises"

const css = (await readFile("registry/honest-ai/styles/prose.css", "utf8")).replace(/\/\*[\s\S]*?\*\//g, "")
const classes = []
const encode = (text) => text.replace(/--_([\w-]+)/g, "--prose-internal-$1").replace(/\s*([(,])\s*/g, "$1").replace(/\s+\)/g, ")").replace(/\s+/g, "_")

// Split selector lists, leaving commas inside :where() and :not() alone.
function selectors(text) {
  let depth = 0
  let start = 0
  const parts = []
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "(") depth += 1
    if (text[index] === ")") depth -= 1
    if (text[index] === "," && depth === 0) {
      parts.push(text.slice(start, index).trim())
      start = index + 1
    }
  }
  return [...parts, text.slice(start).trim()]
}

for (const rule of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
  for (const selector of selectors(rule[1])) {
    const root = selector === ".honest-prose"
    // Tailwind sorts utilities itself. Preserve overlapping CSS rules with
    // explicit specificity rather than depending on the order of class names.
    const priority = selector.includes(":first-child") ? 3 :
      /:is\(h1, h2\)|\+ \*|ul ul|contains-task-list|li\) >|:where\(hr\)|prose-scroll\) >|a:hover|p \+ p|\) \+ li\)|dd \+ dt|\(kbd\)|:has\(> code\)|\) :where\(blockquote|\) :where\(li\)/.test(selector) ? 2 : 1
    const variant = root ? "" : `[${encode(selector.replace(".honest-prose", "&".repeat(priority)))}]:`
    for (const declaration of rule[2].split(";").map((value) => value.trim()).filter(Boolean)) {
      // Logical border overrides must beat the border reset regardless of
      // Tailwind's property sorting.
      const orderedVariant = declaration.startsWith("border-block-start:")
        ? variant.replace(`[${"&".repeat(priority)}`, `[${"&".repeat(priority + 1)}`)
        : variant
      // Markdown aligns table columns with inline styles, which an important
      // utility would override.
      const important = declaration.startsWith("text-align:") ? "" : "!"
      classes.push(`${orderedVariant}[${encode(declaration.replace(/:\s*/, ":"))}]${important}`)
    }
  }
}

const source = `// Generated from registry/styles/prose.css by npm run prose:generate.\n// Tailwind v4: keep this file inside your source scan. No extra stylesheet is needed.\n\n/** Complete prose styles. Customize with the --prose-* variables. */\nexport const proseTailwind = [\n${classes.map((value) => `  ${JSON.stringify(value)},`).join("\n")}\n].join(" ")\n\n/** Static classes for copying into a template; paste the result into scanned source. */\nexport function proseTailwindClasses(settings: Record<string, string> = {}) {\n  const variables = Object.entries(settings).map(([name, value]) => {\n    if (!/^--prose-[a-z-]+$/.test(name) || /[;{}\\[\\]\\\\]/.test(value)) {\n      throw new Error("Invalid prose setting.")\n    }\n    return \`[\${name}:\${value.replaceAll("_", "\\\\_").replace(/\\s+/g, "_")}]\`\n  })\n  return [proseTailwind, ...variables].join(" ")\n}\n`
if (process.argv.includes("--check")) {
  if (await readFile("registry/honest-ai/lib/prose-tailwind.ts", "utf8") !== source) {
    throw new Error("Tailwind styles are stale. Run npm run prose:generate.")
  }
  console.log("Tailwind styles match prose.css.")
} else {
  await writeFile("registry/honest-ai/lib/prose-tailwind.ts", source)
  console.log(`Generated ${classes.length} Tailwind utilities from prose.css.`)
}
