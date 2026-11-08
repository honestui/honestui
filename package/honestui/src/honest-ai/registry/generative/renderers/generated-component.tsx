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
import { chatMarkdownComponents } from "../task-list";
import { SyntaxLine, useSyntax } from "../../lib/prose-syntax-react.js";
import { languageDisplayName } from "../../lib/prose-syntax-shared.js";
import { ContextCards } from "../../ai/context-cards.js";
import * as Icons from "honestui/icons";
import {
  ArrowDownRight as ArrowDownRightIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ChevronRight as ChevronRightIcon,
  CornerDownRight as CornerDownRightIcon,
} from "honestui/icons";
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
import { GeneratedTable } from "./table";
import { GeneratedArtifact } from "./artifact";
import { GeneratedHtmlVisual } from "./html-visual";
import { ChatBusyContext, ChatReplyContext, InsideCardContext, array, sendsMessage, nodeProps, record, safeUrl, text, type Props } from "./shared";
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
const badgeTones = {
  neutral: "secondary",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
} as const satisfies Record<Tone, string>;

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
// floating layer inside a reply. A reply is narrower than a page, so a card
// in it sits one spacing step tighter than the page-level card. Every framed
// block in a reply (cards, tables, charts, quizzes) shares the 16px radius.
const flatCard = "rounded-[var(--hui-radius-4)] shadow-none gap-[var(--hui-space-6)] py-[var(--hui-space-6)]";
const flatCardContent = "px-[var(--hui-space-6)]";
// Cards in a grid of several, such as metrics, are tighter again.
const itemCard = "rounded-[var(--hui-radius-4)] shadow-none gap-[var(--hui-space-3)] py-[var(--hui-space-5)]";
// Content fills the card, so in a row of cards each value sits at the
// bottom even when one label wraps onto a second line.
const itemCardContent = "flex-1 px-[var(--hui-space-5)]";

/** A ListItem's position in a numbered ListBlock. */
const ListNumberContext = React.createContext<number | undefined>(undefined);

/** True inside a metric card, where a BoldText value is the headline figure. */
const MetricCardContext = React.createContext(false);

/** "+12.4%" or "-3%" as a direction, for `subtextVariant: "metric"`. */
function metricDirection(value: string): "up" | "down" | undefined {
  const sign = value.trim().charAt(0);
  return sign === "+" ? "up" : sign === "-" || sign === "−" ? "down" : undefined;
}

/** A change as a tinted badge with an arrow, so it does not rely on color alone. */
function Trend({
  direction,
  tone = "neutral",
  children,
}: {
  direction: "up" | "down";
  /** Good or bad, only where the program says so; a rise in costs is not good. */
  tone?: "neutral" | "judged";
  children: React.ReactNode;
}) {
  const Arrow = direction === "up" ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <Badge variant={tone === "neutral" ? "secondary" : direction === "up" ? "success" : "error"}>
      <Arrow aria-hidden="true" className="size-3" />
      {children}
    </Badge>
  );
}

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
          className="grid gap-5"
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
        {/* The hint sits closer to its field than to the next label. */}
        <div className="grid gap-1.5">
          {renderNode(props.input)}
          {!!props.hint && (
            <p id={`${id}-hint`} className="m-0 text-xs text-muted-foreground">
              {text(props.hint)}
            </p>
          )}
        </div>
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
  // In a chat reply the accent fill is kept for a form's submit. Elsewhere in
  // a reply an action is one option among several, so it stays neutral.
  const inReply = React.useContext(ChatReplyContext);
  const busy = React.useContext(ChatBusyContext);
  const neutral = inReply && !form;
  const plan = props.action as ActionPlan | undefined;
  // A reply button that only sends the next message is a follow-up, so it
  // looks like one, whether the model wrote Button or FollowUpItem.
  if (
    neutral &&
    name === "Button" &&
    props.type !== "destructive" &&
    !!plan?.steps?.length &&
    plan.steps.every((step) => step.type === "continue_conversation")
  )
    return <GeneratedFollowUp name="FollowUpItem" props={{ ...props, text: label }} renderNode={renderNode} />;
  return (
    <Button
      type="button"
      variant={
        props.type === "destructive"
          ? props.fill === "outline" || neutral
            ? "destructive-outline"
            : "destructive"
          : props.variant === "secondary"
            ? inReply ? "outline" : "secondary"
            : props.variant === "tertiary"
              ? "ghost"
              : props.fill === "outline" || neutral
                ? "outline"
                : "default"
      }
      // A message can't start while another reply runs, so the control says it's busy.
      disabled={streaming || (busy && sendsMessage(props.action))}
      aria-label={name === "IconButton" ? label : undefined}
      onClick={(event) => {
        if (
          validation &&
          (props.variant == null || props.variant === "primary") &&
          !validation.validateForm()
        ) {
          // The first error may be far above the button; take the reader there.
          const form = event.currentTarget.closest("form");
          requestAnimationFrame(() => {
            const invalid = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
            // A group (radio cards, chips) marks its container, which cannot
            // take focus; its first enabled choice can.
            const target = invalid?.matches("input, select, textarea, button, [tabindex]")
              ? invalid
              : invalid?.querySelector<HTMLElement>(
                  'input:not([disabled]):not([type="hidden"]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
                );
            // Scrolled here, not by focus(), so every engine has moved by
            // the time focusin reaches the message scroller.
            target?.scrollIntoView?.({ block: "center" });
            target?.focus({ preventScroll: true });
          });
          return;
        }
        trigger(label, form, props.action as ActionPlan | undefined);
      }}
    >
      {props.icon ? renderNode(props.icon) : null}
      {name !== "IconButton" && label}
    </Button>
  );
}
const textSizes: Record<string, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

function GeneratedText({ name, props: p }: Pick<GeneratedComponentProps, "name" | "props">) {
  const metric = React.useContext(MetricCardContext);
  const subtext = text(p.subtext);
  const direction = p.subtextVariant === "metric" ? metricDirection(subtext) : undefined;
  const value = text(p.value);
  return (
    <span className="grid min-w-0 gap-1">
      {name === "BoldText" ? (
        <strong
          style={textColorStyle(p.color)}
          className={cn(
            // This face's tabular figures are monospaced; a lone headline
            // value reads better with its natural spacing.
            p.variant === "number" && !metric && "tabular-nums",
            // In a metric card the value is the figure the card exists for.
            metric
              ? "text-2xl font-semibold tracking-tight"
              : textSizes[text(p.size)],
          )}
        >
          {value}
        </strong>
      ) : (
        <span
          style={textColorStyle(p.color)}
          className={cn(p.variant === "number" && "tabular-nums", textSizes[text(p.size)])}
        >
          {value}
        </span>
      )}
      {!!subtext &&
        (direction ? (
          <span>
            {/* The contract's "metric" subtext colors a + green and a - red. */}
            <Trend direction={direction} tone="judged">{subtext}</Trend>
          </span>
        ) : (
          <small className="text-sm text-muted-foreground">{subtext}</small>
        ))}
    </span>
  );
}

/**
 * A list entry. With an action the whole row is one button, so the title is
 * not repeated as a separate button under it.
 */
function GeneratedListItem({ props: p }: GeneratedComponentProps) {
  const trigger = useTriggerAction();
  const streaming = useIsStreaming();
  const form = useFormName();
  const image = record(p.image);
  const number = React.useContext(ListNumberContext);
  const busy = React.useContext(ChatBusyContext);
  const content = (
    <>
      {number !== undefined && (
        <span aria-hidden="true" className="w-4 shrink-0 self-start pt-px text-right text-sm text-muted-foreground tabular-nums">
          {number}
        </span>
      )}
      {safeUrl(image.src) && (
        <img
          src={safeUrl(image.src)}
          alt={text(image.alt)}
          className="size-12 shrink-0 rounded-[var(--hui-radius-2)] object-cover"
          loading="lazy"
        />
      )}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="font-medium text-[var(--hui-color-foreground-base-primary)]">
          {text(p.title)}
        </span>
        {!!p.subtitle && (
          <span className="text-sm text-muted-foreground">{text(p.subtitle)}</span>
        )}
      </span>
    </>
  );
  if (!p.action)
    return <div className="flex min-w-0 items-center gap-3 px-2 py-2">{content}</div>;
  const label = text(p.actionLabel ?? p.title);
  return (
    <button
      type="button"
      disabled={streaming || (busy && sendsMessage(p.action))}
      onClick={() => trigger(label, form, p.action as ActionPlan | undefined)}
      className="flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-[var(--hui-radius-2)] px-2 py-2 text-left outline-none motion-safe:[transition:var(--hui-transition-interactive)] not-disabled:hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {content}
      {p.actionLabel ? (
        <span className="shrink-0 text-sm text-muted-foreground">{text(p.actionLabel)}</span>
      ) : null}
      <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** A suggested next message, styled like the playground's starter prompts. */
function GeneratedFollowUp({ props: p }: GeneratedComponentProps) {
  const trigger = useTriggerAction();
  const streaming = useIsStreaming();
  const form = useFormName();
  const label = text(p.text ?? p.label);
  const busy = React.useContext(ChatBusyContext);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={streaming || busy}
      className="h-auto max-w-full rounded-full text-left whitespace-normal"
      onClick={() => trigger(label, form, p.action as ActionPlan | undefined)}
    >
      <CornerDownRightIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
      {label}
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
      return <GeneratedAction {...input} />;
    case "FollowUpItem":
      return <GeneratedFollowUp {...input} />;
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
          <CardContent style={style} className={flatCardContent}>
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
        // The extra space below sets the header apart from the first field.
        <CardHeader className="px-0 pb-[var(--hui-space-2)]">
          {/* Semibold, so the title outranks the medium-weight field labels. */}
          <CardTitle className="[font-weight:var(--hui-font-weight-semibold)]">{text(p.title)}</CardTitle>
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
        <Markdown style={textColorStyle(p.color)} components={chatMarkdownComponents}>{text(p.text)}</Markdown>
      );
    case "MarkDownRenderer":
      return <Markdown components={chatMarkdownComponents}>{text(p.textMarkdown)}</Markdown>;
    case "CodeBlock":
      return <HighlightedCode language={text(p.language)} code={text(p.codeString)} />;
    case "Text":
    case "BoldText":
      return <GeneratedText name={name} props={p} />;
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
        // Top-aligned, so the icon sits on the title's line when a subtitle wraps.
        <div className="flex min-w-0 items-start gap-3 [&>svg]:mt-0.5">
          {name === "IconText" ? (
            render(p.icon)
          ) : (
            <Image src={p.src} alt={p.alt} />
          )}
          <span className="grid gap-1">
            <strong>{text(p.title)}</strong>
            {!!p.subtitle && (
              <small className="[font-size:var(--hui-font-size-small)] text-muted-foreground">
                {text(p.subtitle)}
              </small>
            )}
          </span>
        </div>
      );
    case "Tag": {
      const tone = tones[text(p.variant)] ?? "neutral";
      return p.fill === "solid" ? (
        <Badge variant="secondary" className={solidTags[tone]}>
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
        <Badge variant={badgeTones[tone]}>
          {render(p.icon)}
          {text(p.text)}
        </Badge>
      );
    }
    case "TagBlock":
      return (
        <div className="flex flex-wrap gap-2">
          {array(p.tags).map((tag, i) => (
            <Badge key={i} variant="secondary">
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
          <TabsList className="w-fit max-w-full">
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
    case "Table":
      return <GeneratedTable props={p} renderNode={render} />;
    case "Artifact":
      return <GeneratedArtifact props={p} renderNode={render} />;
    case "HtmlVisual":
      return <GeneratedHtmlVisual props={p} />;
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
    case "ListBlock": {
      const numbered = p.variant === "number";
      return (
        <ol
          data-slot="generated-list"
          className="m-0 grid list-none divide-y divide-[var(--hui-color-border-base-primary)] p-0"
        >
          {array(p.items).map((item, i) => (
            <li key={i} className="min-w-0 py-1 first:pt-0 last:pb-0">
              <ListNumberContext.Provider value={numbered ? i + 1 : undefined}>
                {render(item)}
              </ListNumberContext.Provider>
            </li>
          ))}
        </ol>
      );
    }
    case "ListItem":
      return <GeneratedListItem {...input} />;
    case "FollowUpBlock":
      return (
        <ul
          aria-label="Suggested follow-ups"
          className="m-0 flex list-none flex-wrap gap-2 p-0"
        >
          {array(p.items).map((item, i) => (
            <li key={i} className="max-w-full">{render(item)}</li>
          ))}
        </ul>
      );
    case "MetricIndicatorInline":
    case "MetricIndicatorWithStrikethrough":
      return (
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-2xl font-semibold tracking-tight">
            {text(p.value)}
          </strong>
          {!!p.previousValue && (
            <del className="text-muted-foreground tabular-nums">{text(p.previousValue)}</del>
          )}
          {!!p.trend && (
            <Trend direction={record(p.trend).direction === "down" ? "down" : "up"}>
              <span className="sr-only">
                {record(p.trend).direction === "down" ? "Down " : "Up "}
              </span>
              {text(record(p.trend).value)}%
            </Trend>
          )}
          {!!p.subtext && (
            <small className="basis-full text-sm text-muted-foreground">{text(p.subtext)}</small>
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
    case "VisualCardBlock": {
      const items = (
        <MetricCardContext.Provider value={name === "SnippetCardBlock" || name === "OverviewCardBlock"}>
          {render(p.items)}
        </MetricCardContext.Provider>
      );
      return p.layout === "carousel" ? (
        <div className="flex gap-3 overflow-x-auto">{items}</div>
      ) : (
        // The block measures itself: two columns when narrow, with an odd
        // last card spanning both; as many as fit when wide, so three
        // metrics share a row. No card sits beside an empty cell.
        <div className="@container">
          <div className="grid grid-cols-1 gap-3 @min-[20rem]:grid-cols-2 @min-[20rem]:[&>:last-child:nth-child(odd)]:col-span-2 @min-[40rem]:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] @min-[40rem]:[&>:last-child:nth-child(odd)]:col-span-1">
            {items}
          </div>
        </div>
      );
    }
    case "SnippetCardItem":
    case "OverviewCardItem":
    case "CompositeCardItem":
    case "VisualCardItem":
    case "ContextCardItem":
      return (
        <Card className={itemCard}>
          <CardContent className={cn(itemCardContent, "grid content-between gap-3")}>
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
