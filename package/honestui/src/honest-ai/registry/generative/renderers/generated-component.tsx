"use client";
import * as React from "react";
import { Button } from "../../../components/ui/button.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../components/ui/card.js";
import { Badge } from "../../../components/ui/badge.js";
import { Separator } from "../../../components/ui/separator.js";
import { Label } from "../../../components/ui/label.js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs.js";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../../../components/ui/accordion.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.js";
import { Alert, AlertTitle, AlertDescription } from "../../../components/ui/alert.js";
import { Markdown } from "../../ai/markdown.js";
import { cn } from "../../../lib/utils.js";
import { ProseCodeBlock } from "../../ai/prose-code-block.js";
import { SyntaxLine, useSyntax } from "../../lib/prose-syntax-react.js";
import { languageDisplayName } from "../../lib/prose-syntax-shared.js";
import { ContextCards } from "../../ai/context-cards.js";
import { RecordsTable } from "../../ai/records-table.js";
import * as Icons from "honestui/icons";
import {
  FormNameContext,
  FormValidationContext,
  useCreateFormValidation,
  useFormValidation,
  useFormName,
  useIsStreaming,
  useStateField,
  useTriggerAction,
  type ActionPlan,
} from "../runtime/react";
import { FieldLabelContext, GeneratedField } from "./fields";
import { GeneratedChart } from "./charts";
import { GeneratedDiagram } from "./diagram";
import { GeneratedCalculator, GeneratedResult } from "./calculator";
import { GeneratedQuiz } from "./quiz";
import { GeneratedPartsDiagram } from "./parts-diagram";
import { GeneratedMap } from "./map";
import { GeneratedEditableTable } from "./editable-table";
import { InsideCardContext, array, nodeProps, record, safeUrl, text, type Props } from "./shared";
export type GeneratedComponentProps = {
  name: string;
  props: Props;
  renderNode: (value: unknown) => React.ReactNode;
};
const fields = new Set([
  "Input",
  "TextArea",
  "Select",
  "DatePicker",
  "Slider",
  "CheckBoxGroup",
  "RadioGroup",
  "SwitchGroup",
  "Chips",
  "OptionCards",
]);
const virtual = new Set([
  "Col",
  "Series",
  "Point",
  "Slice",
  "ScatterSeries",
  "SelectItem",
  "CheckBoxItem",
  "RadioItem",
  "SwitchItem",
  "ChipItem",
  "OptionCard",
  "TabItem",
  "AccordionItem",
  "SectionItem",
  "StepsItem",
  "DiagramNode",
  "QuizQuestion",
  "DiagramPart",
  "MapPlace",
]);
type Tone = "neutral" | "info" | "success" | "warning" | "danger";
const tones: Record<string, Tone> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

const toneTokens: Record<Tone, string> = {
  neutral: "base-secondary",
  info: "accent-primary",
  success: "success-primary",
  warning: "attention-primary",
  danger: "danger-primary",
};

// Generated code blocks use the same highlighting as Markdown's fenced code.
function HighlightedCode({ language, code }: { language: string; code: string }) {
  const syntax = useSyntax(code, language);
  return (
    <ProseCodeBlock
      label={language.trim() ? languageDisplayName(language) : "Code"}
      code={code}
      codeClassName="honest-syntax"
      renderLine={syntax ? (line, index) => (syntax.lines[index] ? <SyntaxLine tokens={syntax.lines[index]} /> : line) : undefined}
    />
  );
}

/**
 * A tone as a text color. The status hues are too light to read as text on the
 * page in one theme or the other, so each is mixed toward the page's text color.
 */
function toneTextColor(tone: Tone) {
  const hue = `var(--hui-color-foreground-${toneTokens[tone]})`;
  return tone === "neutral"
    ? hue
    : `color-mix(in oklab, ${hue} 55%, var(--hui-color-foreground-base-primary))`;
}

/** The style for a `color` prop: `color`, and the variable Markdown reads. */
function textColorStyle(color: unknown): React.CSSProperties | undefined {
  const tone = color === "muted" ? "neutral" : tones[text(color)];
  if (!tone) return undefined;
  const value = toneTextColor(tone);
  return { color: value, "--prose-color": value } as React.CSSProperties;
}

// Badge has the soft tints. A solid Tag takes its colors from here.
const solidTags: Record<Tone, string> = {
  neutral:
    "bg-[var(--hui-color-foreground-base-primary)] text-[var(--hui-color-background-base-primary)]",
  info: "bg-[var(--hui-color-background-accent-emphasis)] text-[var(--hui-color-foreground-accent-emphasis)]",
  success:
    "bg-[var(--hui-color-background-success-emphasis)] text-[var(--hui-color-foreground-success-emphasis)]",
  warning:
    "bg-[var(--hui-color-background-attention-emphasis)] text-[var(--hui-color-foreground-attention-emphasis)]",
  danger:
    "bg-[var(--hui-color-background-danger-emphasis)] text-[var(--hui-color-foreground-danger-emphasis)]",
};
// The card's own faint edge, without its shadow: a raised card reads as a
// floating layer inside a reply.
const flatCard = "shadow-none";

const gaps: Record<string, string> = {
  none: "0",
  xs: "var(--hui-space-1)",
  s: "var(--hui-space-2)",
  m: "var(--hui-space-4)",
  l: "var(--hui-space-6)",
  xl: "var(--hui-space-8)",
  "2xl": "var(--hui-space-10)",
};
function GeneratedForm({ props, renderNode }: GeneratedComponentProps) {
  const validation = useCreateFormValidation();
  return (
    <FormValidationContext.Provider value={validation}>
      <FormNameContext.Provider value={text(props.name)}>
        <form
          aria-label={text(props.name)}
          onSubmit={(event) => event.preventDefault()}
          className="grid gap-4"
        >
          {renderNode(props.fields)}
          {renderNode(props.buttons)}
        </form>
      </FormNameContext.Provider>
    </FormValidationContext.Provider>
  );
}
function GeneratedFormControl({ props, renderNode }: GeneratedComponentProps) {
  const id = React.useId();
  return (
    <FieldLabelContext.Provider
      value={{
        id,
        label: text(props.label),
        hintId: props.hint ? `${id}-hint` : undefined,
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor={id}>{text(props.label)}</Label>
        {renderNode(props.input)}
        {!!props.hint && (
          <p id={`${id}-hint`} className="m-0 text-sm text-muted-foreground">
            {text(props.hint)}
          </p>
        )}
      </div>
    </FieldLabelContext.Provider>
  );
}
function GeneratedAction({ name, props, renderNode }: GeneratedComponentProps) {
  const trigger = useTriggerAction();
  const streaming = useIsStreaming();
  const form = useFormName();
  const validation = useFormValidation();
  const label = text(props.label ?? props.name ?? props.text ?? props.title);
  return (
    <Button
      type="button"
      variant={
        props.type === "destructive"
          ? props.fill === "outline"
            ? "destructive-outline"
            : "destructive"
          : props.variant === "secondary"
            ? "secondary"
            : props.variant === "tertiary" || name === "FollowUpItem"
              ? "ghost"
              : props.fill === "outline"
                ? "outline"
                : "default"
      }
      disabled={streaming}
      aria-label={name === "IconButton" ? label : undefined}
      onClick={() => {
        if (
          validation &&
          (props.variant == null || props.variant === "primary") &&
          !validation.validateForm()
        )
          return;
        trigger(label, form, props.action as ActionPlan | undefined);
      }}
    >
      {props.icon ? renderNode(props.icon) : null}
      {name !== "IconButton" && label}
    </Button>
  );
}
function GeneratedModal({ props, renderNode }: GeneratedComponentProps) {
  const field = useStateField("open", props.open);
  return (
    <Dialog
      open={field.value === true || field.value === "true"}
      onOpenChange={field.setValue}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text(props.title)}</DialogTitle>
        </DialogHeader>
        {renderNode(props.children)}
      </DialogContent>
    </Dialog>
  );
}
function GeneratedSections({ props, renderNode }: GeneratedComponentProps) {
  const streaming = useIsStreaming();
  const [selection, setSelection] = React.useState<string[] | null>(null);
  const items = array(props.sections).map(nodeProps);
  const values = items.map((item, i) => text(item.value) || String(i));
  if (props.isFoldable === false)
    return (
      <div className="grid gap-4">
        {items.map((item, i) => (
          <section key={i}>
            <h2 data-slot="section-title" className="m-0 mb-2 text-base font-semibold">{text(item.trigger)}</h2>
            {renderNode(item.content)}
          </section>
        ))}
      </div>
    );
  const open = selection ?? (streaming ? values : values.slice(0, 1));
  return (
    <Accordion type="multiple" value={open} onValueChange={setSelection}>
      {items.map((item, i) => (
        <AccordionItem key={values[i]} value={values[i]}>
          <AccordionTrigger>{text(item.trigger)}</AccordionTrigger>
          <AccordionContent>{renderNode(item.content)}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
function GeneratedCarousel({ props, renderNode }: GeneratedComponentProps) {
  const [index, setIndex] = React.useState(0);
  const slides = array(props.children);
  const active = Math.min(index, Math.max(0, slides.length - 1));
  return (
    <section aria-label="Carousel" className="grid gap-3">
      <div>{renderNode(slides[active])}</div>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          disabled={active === 0}
          onClick={() => setIndex(active - 1)}
        >
          Previous slide
        </Button>
        <span role="status">
          {slides.length ? active + 1 : 0} of {slides.length}
        </span>
        <Button
          variant="secondary"
          disabled={active >= slides.length - 1}
          onClick={() => setIndex(active + 1)}
        >
          Next slide
        </Button>
      </div>
    </section>
  );
}
function Image({ src, alt }: { src: unknown; alt: unknown }) {
  const url = safeUrl(src);
  return url ? (
    <img
      src={url}
      alt={text(alt)}
      className="max-h-96 max-w-full rounded-md object-contain"
      loading="lazy"
    />
  ) : null;
}
export function GeneratedComponent(
  input: GeneratedComponentProps,
): React.ReactNode {
  const { name, props: p, renderNode: render } = input;
  if (virtual.has(name)) return null;
  if (fields.has(name))
    return <GeneratedField name={name} props={p} renderNode={render} />;
  if (name.endsWith("Chart")) return <GeneratedChart name={name} props={p} />;
  switch (name) {
    case "Form":
      return <GeneratedForm {...input} />;
    case "FormControl":
      return <GeneratedFormControl {...input} />;
    case "Button":
    case "IconButton":
    case "FollowUpItem":
      return <GeneratedAction {...input} />;
    case "Modal":
      return <GeneratedModal {...input} />;
    case "EditableTable":
      return <GeneratedEditableTable props={p} />;
    case "Stack":
    case "Card": {
      const style: React.CSSProperties = {
        display: "flex",
        flexDirection: p.direction === "row" ? "row" : "column",
        flexWrap: p.wrap === true ? "wrap" : "nowrap",
        gap: gaps[text(p.gap)] ?? gaps.m,
        alignItems:
          (
            {
              start: "flex-start",
              end: "flex-end",
              center: "center",
              stretch: "stretch",
              baseline: "baseline",
            } as const
          )[text(p.align) as "start"] ?? "stretch",
        justifyContent:
          (
            {
              start: "flex-start",
              end: "flex-end",
              center: "center",
              between: "space-between",
              around: "space-around",
              evenly: "space-evenly",
            } as const
          )[text(p.justify) as "start"] ?? "flex-start",
        minWidth: 0,
        flex: 1,
      };
      const children = (
        <>
          {render(p.children)}
          {array(p.sources).length > 0 && (
            <ol aria-label="Sources" className="m-0 grid gap-2 p-0 text-sm">
              {array(p.sources).map((source, i) => {
                const item = record(source),
                  url = safeUrl(item.url);
                return (
                  <li key={i} className="list-inside">
                    {url ? (
                      <a
                        href={url}
                        rel="noreferrer"
                        target="_blank"
                        className="underline"
                      >
                        {text(item.title)} (opens in a new tab)
                      </a>
                    ) : (
                      text(item.title)
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </>
      );
      return name === "Card" && p.variant !== "clear" ? (
        <Card
          style={{ minWidth: 0, flex: 1 }}
          className={cn(flatCard, p.variant === "sunk" && "bg-muted")}
        >
          <CardContent style={style}>
            <InsideCardContext.Provider value>{children}</InsideCardContext.Provider>
          </CardContent>
        </Card>
      ) : (
        <div style={style}>{children}</div>
      );
    }
    case "CardHeader":
      return (
        // It renders inside the Card's content, which already has the inset.
        <CardHeader className="px-0">
          <CardTitle>{text(p.title)}</CardTitle>
          {!!p.subtitle && (
            <CardDescription>{text(p.subtitle)}</CardDescription>
          )}
        </CardHeader>
      );
    case "InlineHeader":
      return (
        <header className="grid gap-1">
          {/* data-slot opts out of the site's page-heading size for bare h2s. */}
          <h2 data-slot="inline-header-title" className="m-0 text-base font-semibold">{text(p.heading)}</h2>
          {!!p.description && (
            <p className="m-0 text-sm text-muted-foreground">
              {text(p.description)}
            </p>
          )}
        </header>
      );
    case "TextContent":
      return (
        <Markdown style={textColorStyle(p.color)}>{text(p.text)}</Markdown>
      );
    case "MarkDownRenderer":
      return <Markdown>{text(p.textMarkdown)}</Markdown>;
    case "CodeBlock":
      return <HighlightedCode language={text(p.language)} code={text(p.codeString)} />;
    case "Text":
    case "BoldText":
      return (
        <span className="grid gap-1">
          {name === "BoldText" ? (
            <strong style={textColorStyle(p.color)}>
              {text(p.value)}
            </strong>
          ) : (
            <span style={textColorStyle(p.color)}>{text(p.value)}</span>
          )}
          {!!p.subtext && (
            <small className="text-muted-foreground">{text(p.subtext)}</small>
          )}
        </span>
      );
    case "Callout":
    case "TextCallout":
      return p.visible === false ? null : (
        <Alert
          variant={
            p.variant === "error" || p.variant === "danger"
              ? "error"
              : "default"
          }
        >
          <AlertTitle>{text(p.title)}</AlertTitle>
          <AlertDescription>{text(p.description)}</AlertDescription>
        </Alert>
      );
    case "Label":
      return <Label>{text(p.text)}</Label>;
    case "Image":
    case "ImageBlock":
      return <Image src={p.src} alt={p.alt} />;
    case "ImageGallery":
      return (
        <div className="flex flex-wrap gap-3">
          {array(p.images).map((image, i) => {
            const item = record(image);
            return (
              <figure key={i} className="m-0">
                <Image src={item.src} alt={item.alt} />
                {!!item.details && (
                  <figcaption>{text(item.details)}</figcaption>
                )}
              </figure>
            );
          })}
        </div>
      );
    case "Icon": {
      const key = text(p.name)
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
      const Icon = (
        Icons as unknown as Record<
          string,
          React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
        >
      )[key];
      return Icon ? <Icon className="size-5" aria-hidden /> : null;
    }
    case "IconText":
    case "ImageText":
    case "ImageTextLarge":
      return (
        <div className="flex items-center gap-3">
          {name === "IconText" ? (
            render(p.icon)
          ) : (
            <Image src={p.src} alt={p.alt} />
          )}
          <span className="grid gap-1">
            <strong>{text(p.title)}</strong>
            {!!p.subtitle && (
              <small className="text-muted-foreground">
                {text(p.subtitle)}
              </small>
            )}
          </span>
        </div>
      );
    case "Tag": {
      const tone = tones[text(p.variant)] ?? "neutral";
      return p.fill === "solid" ? (
        <Badge variant="neutral" className={solidTags[tone]}>
          {render(p.icon)}
          {text(p.text)}
        </Badge>
      ) : p.fill === "outline" ? (
        <Badge
          variant="outline"
          className={tone === "neutral" ? undefined : "border-current"}
          style={
            tone === "neutral" ? undefined : { color: toneTextColor(tone) }
          }
        >
          {render(p.icon)}
          {text(p.text)}
        </Badge>
      ) : (
        <Badge variant={tone}>
          {render(p.icon)}
          {text(p.text)}
        </Badge>
      );
    }
    case "TagBlock":
      return (
        <div className="flex flex-wrap gap-2">
          {array(p.tags).map((tag, i) => (
            <Badge key={i} variant="neutral">
              {text(tag)}
            </Badge>
          ))}
        </div>
      );
    case "Separator":
      return (
        <Separator
          orientation={p.orientation === "vertical" ? "vertical" : "horizontal"}
        />
      );
    case "Buttons":
      return (
        <div
          className={
            p.direction === "column" ? "grid gap-2" : "flex flex-wrap gap-2"
          }
        >
          {render(p.buttons)}
        </div>
      );
    case "Tabs": {
      const items = array(p.items).map(nodeProps);
      return (
        <Tabs defaultValue={text(items[0]?.value)}>
          <TabsList>
            {items.map((item, i) => (
              <TabsTrigger key={i} value={text(item.value)}>
                {text(item.trigger)}
              </TabsTrigger>
            ))}
          </TabsList>
          {items.map((item, i) => (
            <TabsContent
              key={i}
              value={text(item.value)}
              className="grid gap-4 pt-4"
            >
              {render(item.content)}
            </TabsContent>
          ))}
        </Tabs>
      );
    }
    case "SectionBlock":
      return <GeneratedSections {...input} />;
    case "Accordion": {
      const items = array(p.items).map(nodeProps);
      return (
        <Accordion>
          {items.map((item, i) => (
            <AccordionItem key={i} value={text(item.value) || String(i)}>
              <AccordionTrigger>{text(item.trigger)}</AccordionTrigger>
              <AccordionContent>{render(item.content)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
    }
    case "Carousel":
      return <GeneratedCarousel {...input} />;
    case "Table": {
      const columns = array(p.columns).map(nodeProps);
      const length = Math.max(
        0,
        ...columns.map((column) => array(column.data).length),
      );
      return (
        <RecordsTable
          label="Generated table"
          columns={columns.map((column, i) => ({
            id: String(i),
            header: text(column.label),
          }))}
          rows={Array.from({ length }, (_, index) => ({
            id: String(index),
            name: String(index + 1),
            cells: Object.fromEntries(
              columns.map((column, i) => {
                const value = array(column.data)[index];
                return [
                  String(i),
                  value && typeof value === "object"
                    ? render(value)
                    : text(value),
                ];
              }),
            ),
          }))}
        />
      );
    }
    case "EntityList":
      return (
        <dl className="m-0 grid gap-2">
          {[p.header, ...array(p.rows), p.footer]
            .filter(Boolean)
            .map((row, i) => {
              const item = record(row);
              return (
                <div
                  key={i}
                  className="flex justify-between gap-4 border-b pb-2"
                >
                  <dt>{text(item.left)}</dt>
                  <dd className="m-0 tabular-nums">{text(item.right)}</dd>
                </div>
              );
            })}
        </dl>
      );
    case "Map":
      return <GeneratedMap props={p} />;
    case "PartsDiagram":
      return <GeneratedPartsDiagram props={p} />;
    case "Quiz":
      return <GeneratedQuiz props={p} />;
    case "Calculator":
      return <GeneratedCalculator props={p} renderNode={render} />;
    case "Result":
      return <GeneratedResult props={p} />;
    case "Diagram":
      return <GeneratedDiagram props={p} />;
    case "Steps":
      return (
        <ol className="grid gap-4">
          {array(p.items).map((value, i) => {
            const item = nodeProps(value);
            return (
              <li key={i}>
                <strong>{text(item.title)}</strong>
                <p>{text(item.details)}</p>
              </li>
            );
          })}
        </ol>
      );
    case "ListBlock":
      return (
        <ol className="grid gap-3">
          {array(p.items).map((item, i) => (
            <li key={i}>{render(item)}</li>
          ))}
        </ol>
      );
    case "ListItem":
      return (
        <div className="grid gap-2">
          <strong>{text(p.title)}</strong>
          {!!p.subtitle && (
            <p className="m-0 text-muted-foreground">{text(p.subtitle)}</p>
          )}
          {!!p.image && (
            <Image src={record(p.image).src} alt={record(p.image).alt} />
          )}
          {!!p.action && (
            <GeneratedAction
              {...input}
              props={{ ...p, label: p.actionLabel ?? p.title }}
            />
          )}
        </div>
      );
    case "FollowUpBlock":
      return <div className="flex flex-wrap gap-2">{render(p.items)}</div>;
    case "MetricIndicatorInline":
    case "MetricIndicatorWithStrikethrough":
      return (
        <div className="flex flex-wrap items-baseline gap-2">
          <strong className="tabular-nums">{text(p.value)}</strong>
          {!!p.previousValue && (
            <del className="text-muted-foreground">{text(p.previousValue)}</del>
          )}
          {!!p.subtext && <small>{text(p.subtext)}</small>}
          {!!p.trend && (
            <span>
              {record(p.trend).direction === "up" ? "Increase" : "Decrease"}{" "}
              {text(record(p.trend).value)}
            </span>
          )}
        </div>
      );
    case "ContextCardBlock":
      return (
        <ContextCards
          title="Context"
          chunks={array(p.items).map((value, i) => {
            const item = nodeProps(value);
            return {
              id: text(item.id) || String(i),
              title:
                typeof item.title === "string"
                  ? item.title
                  : text(nodeProps(item.title).text),
              body: text(item.body),
            };
          })}
        />
      );
    case "SnippetCardBlock":
    case "OverviewCardBlock":
    case "CompositeCardBlock":
    case "VisualCardBlock":
      return (
        <div
          className={
            p.layout === "carousel"
              ? "flex gap-4 overflow-x-auto"
              : "grid gap-4 sm:grid-cols-2"
          }
        >
          {render(p.items)}
        </div>
      );
    case "SnippetCardItem":
    case "OverviewCardItem":
    case "CompositeCardItem":
    case "VisualCardItem":
    case "ContextCardItem":
      return (
        <Card className={flatCard}>
          <CardContent className="grid gap-3">
            <Image src={p.bgImageSrc} alt={p.bgImageAlt} />
            {render(p.lhs ?? p.top ?? p.header)}
            {render(p.rhs ?? p.bottom ?? p.body)}
            {!!p.title && <strong>{text(p.title)}</strong>}
            {render(p.tag)}
            {!!p.footer && (
              <footer className="flex items-center justify-between gap-3">
                {render(record(p.footer).price)}
                {render(record(p.footer).button)}
              </footer>
            )}
          </CardContent>
        </Card>
      );
    default:
      throw new Error(`No Honest renderer for ${name}`);
  }
}
