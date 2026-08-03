export function getIconUsageCode(exportName: string, importPath = "honestui/icons") {
  return `import { ${exportName} } from "${importPath}";

export function ${exportName}Example() {
  return <${exportName} size={24} aria-hidden="true" />;
}`;
}
