import { CodeCollapsibleWrapper } from "@/components/docs/component/code-collapsible-wrapper";
import { CodeBlock } from "@/components/docs/mdx/components/code";
import { getRegistryItem } from "@/lib/registry";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export async function ComponentSource({
  name,
  title,
  language,
  collapsible = true,
  className,
}: ComponentProps<"div"> & {
  name: string;
  title?: string;
  language?: string;
  collapsible?: boolean;
}) {
  const item = await getRegistryItem(name);
  const code = item?.files?.[0]?.content;

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
