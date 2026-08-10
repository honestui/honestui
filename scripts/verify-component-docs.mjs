import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const docsRoot = path.join(projectRoot, "content/docs/components");
const examplesRoot = path.join(projectRoot, "registry/default/examples");
const uiRoot = path.join(projectRoot, "registry/default/ui");
const indexSource = fs.readFileSync(
  path.join(projectRoot, "registry/__index__.tsx"),
  "utf8",
);
const failures = [];

const docsFiles = fs
  .readdirSync(docsRoot)
  .filter((file) => file.endsWith(".mdx"))
  .sort();

const previewIndex = new Set(
  [...indexSource.matchAll(/^\s*"([^"]+)":\s*\{\s*component:/gm)].map(
    (match) => match[1],
  ),
);

const requiredHeadings = [
  "Overview",
  "Anatomy",
  "Accessibility",
  "Installation",
  "Usage",
  "Examples",
];

function proseWordCount(source) {
  return (
    source
      .replace(/^---[\s\S]*?---/, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/<[^>]*>/g, " ")
      .match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0
  );
}

for (const file of docsFiles) {
  const source = fs.readFileSync(path.join(docsRoot, file), "utf8");
  const previews = [
    ...source.matchAll(/<ComponentPreview[\s\S]*?name="([^"]+)"[\s\S]*?\/>/g),
  ].map((match) => match[1]);

  for (const heading of requiredHeadings) {
    if (!new RegExp(`^## ${heading}$`, "im").test(source)) {
      failures.push(`${file}: missing required “${heading}” section`);
    }
  }

  if (!/^## API(?: reference)?$/im.test(source)) {
    failures.push(`${file}: missing local API reference`);
  }

  const wordCount = proseWordCount(source);
  if (wordCount < 180) {
    failures.push(
      `${file}: only ${wordCount} prose words; expected at least 180`,
    );
  }

  if (previews.length < 2) {
    failures.push(`${file}: expected at least two functional previews`);
  }
  if (previews.length > 10) {
    failures.push(
      `${file}: ${previews.length} previews is too fragmented; consolidate related states`,
    );
  }

  for (const name of previews) {
    const examplePath = path.join(examplesRoot, `${name}.tsx`);
    if (!fs.existsSync(examplePath)) {
      failures.push(`${file}: preview “${name}” has no example source`);
      continue;
    }
    if (!previewIndex.has(name)) {
      failures.push(
        `${file}: preview “${name}” is missing from registry/__index__.tsx`,
      );
    }

    const exampleSource = fs.readFileSync(examplePath, "utf8");
    const forbiddenPatterns = [
      [/\balert\s*\(/, "browser alert"],
      [/Math\.random\s*\(/, "random behavior"],
      [/href=["']#["']/, "placeholder link"],
      [/console\.(?:log|warn|error)\s*\(/, "console-only result"],
    ];
    for (const [pattern, label] of forbiddenPatterns) {
      if (pattern.test(exampleSource)) {
        failures.push(`${name}.tsx: contains ${label}`);
      }
    }
  }
}

const docSlugs = new Set(docsFiles.map((file) => file.replace(/\.mdx$/, "")));
const docAliases = new Map([
  ["alert-dialog", "alert"],
  ["checkbox-group", "checkbox"],
  ["dropdown-menu", "menu"],
  ["toggle-group", "toggle"],
  ["toast-gooey", "toast"],
  ["toast-gooey-icons", "toast"],
  ["toast-gooey-renderer", "toast"],
]);

for (const file of fs
  .readdirSync(uiRoot)
  .filter((name) => name.endsWith(".tsx"))) {
  const slug = file.replace(/\.tsx$/, "");
  const documentedAs = docAliases.get(slug) ?? slug;
  if (!docSlugs.has(documentedAs)) {
    failures.push(
      `${file}: public UI source has no component documentation page`,
    );
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `Validated ${docsFiles.length} component pages: structure, prose depth, preview coverage, example integrity, and public component coverage are valid.`,
);
