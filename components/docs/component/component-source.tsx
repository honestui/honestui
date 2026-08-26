import { CodeCollapsibleWrapper } from "@/components/docs/component/code-collapsible-wrapper";
import { CodeBlock } from "@/components/docs/mdx/components/code";
import { getRegistryItem } from "@/lib/registry";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export async function ComponentSource({
  name,
  title,
  language,
  file,
  collapsible = true,
  className,
}: ComponentProps<"div"> & {
  name: string;
  title?: string;
  language?: string;
  file?: string;
  collapsible?: boolean;
}) {
  const item = await getRegistryItem(name);
  const selectedFile = file
    ? item?.files?.find((candidate) =>
        candidate.path.replace(/\\/g, "/").endsWith(file),
      )
    : item?.files?.[0];
  const code = selectedFile?.content;

  if (!code) {
    return null;
  }

  const lang = language ?? title?.split(".").pop() ?? "tsx";

  if (!collapsible) {
    return (
      <div className={cn("relative", className)}>
        <CodeBlock code={code} language={lang} title={title} />
      </div>
    );
  }

  return (
    <CodeCollapsibleWrapper className={className}>
      <CodeBlock withWrapper code={code} language={lang} title={title} />
    </CodeCollapsibleWrapper>
  );
}
