import { ComponentPreviewTabs } from "@/components/docs/component/component-preview-tabs";
import { CodeBlock } from "@/components/docs/mdx/components/code";
import { GallerySampleView } from "./sample-view";
import { gallerySamples } from "./samples";

/** A gallery entry: the rendered reply, and the Markdown the model wrote for it. */
export function GenerativeSample({ id, title }: { id: string; title?: string }) {
  const reply = gallerySamples[id]?.reply ?? "";
  return (
    <ComponentPreviewTabs
      align="start"
      playground
      data-component-preview={`gallery-${id}`}
      title={title ?? id}
      component={<GallerySampleView id={id} />}
      source={<CodeBlock code={reply.replaceAll("{origin}", "https://example.com")} language="md" title="reply.md" />}
    />
  );
}
