export function getIconUsageCode(exportName: string) {
  return `import { ${exportName} } from "honestui/icons";

export function ${exportName}Example() {
  return <${exportName} size={24} aria-hidden="true" />;
}`;
}
