import { ComponentPreviewTabs } from "@/components/docs/component/component-preview-tabs";
import { ComponentSource } from "@/components/docs/component/component-source";
import { Index } from "@/registry/__index__";
import { cn } from "@/lib/utils";

interface ComponentPreviewProps extends Omit<React.ComponentProps<"div">, "ref"> {
  name: string;
  align?: "center" | "start" | "end";
  description?: string;
  hideCode?: boolean;
  title?: string;
  containerClassName?: string;
  previewClassName?: string;
  playground?: boolean;
}

export function ComponentPreview({
  name,
  className,
  align = "center",
  hideCode = false,
  title,
  containerClassName,
  playground = false,
  ...props
}: ComponentPreviewProps) {
  const Component = Index[name]?.component;

  if (!Component) {
    return (
      <p className="text-muted-foreground mt-4 text-[13px] leading-6">
        Component{" "}
        <code className="bg-background relative mx-1 rounded-md border px-[0.3rem] py-1 font-mono text-[0.75rem] text-red-500 outline-none">
          {name}
        </code>{" "}
        not found in registry. Contact the developer to add it.{" "}
        <a
          target="_blank"
          href="https://github.com/honestui/honestui/issues"
          className="text-primary hover:underline"
        >
          open an issue
        </a>
      </p>
    );
  }

  return (
    <ComponentPreviewTabs
      align={align}
      className={cn(className)}
      containerClassName={containerClassName}
      component={<Component />}
      hideCode={hideCode}
      playground={playground}
      source={<ComponentSource collapsible={false} name={name} />}
      title={title ?? name}
      {...props}
    />
  );
}
