import path from "node:path"

export function resolveRegistryOutputPath(outputDir: string, name: string) {
  const resolvedOutputDir = path.resolve(outputDir)
  const outputPath = path.resolve(resolvedOutputDir, `${name}.json`)
  const relativePath = path.relative(resolvedOutputDir, outputPath)

  if (
    relativePath.startsWith(`..${path.sep}`) ||
    relativePath === ".." ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(
      `Registry item name resolves outside the output directory: ${name}`
    )
  }

  return outputPath
}
