"use client";
import * as React from "react";
import { isValid, parseISO } from "date-fns";
import { SingleDatePicker } from "./date-picker";
import { DateRangePicker } from "../../../components/product/date-range-picker/date-range-picker.js";
import { Input } from "../../../components/ui/input.js";
import { Textarea } from "../../../components/ui/textarea.js";
import { Checkbox } from "../../../components/ui/checkbox.js";
import { Switch } from "../../../components/ui/switch.js";
import { Slider } from "../../../components/ui/slider.js";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/select.js";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group.js";
import {
  useStateField,
  useIsStreaming,
  useFormValidation,
  parseStructuredRules,
} from "../runtime/react";
import { cn } from "../../../lib/utils.js";
import { array, nodeProps, record, selectedChoice, text, type Props } from "./shared";
/**
 * True inside a Calculator, where results update as inputs change, so each
 * input checks its rules whenever its value changes rather than on submit.
 */
export const LiveValidationContext = React.createContext(false);

export const FieldLabelContext = React.createContext<{
  id: string;
  label: string;
  hintId?: string;
} | null>(null);
/**
 * A slider's thumbs. State holds [n], but a program may declare a bare number
 * ($amount = 300); with no usable value the thumb starts at min.
 */
function sliderValues(value: unknown, min: unknown): number[] {
  const values = (Array.isArray(value) ? value : [value])
    .map(Number)
    .filter(Number.isFinite);
  return values.length ? values : [Number(min) || 0];
}

// A checkbox, switch or radio beside its label: the control sits on the
// label's first line when a description wraps under it.
const choiceRow = "flex items-start gap-2.5 text-sm [&>:first-child]:mt-0.5 [&>:first-child]:shrink-0";
const choiceDescription = "block text-muted-foreground";

export function GeneratedField({
  name,
  props,
  renderNode,
}: {
  name: string;
  props: Props;
  renderNode: (value: unknown) => React.ReactNode;
}) {
  const field = useStateField(text(props.name), props.value);
  const streaming = useIsStreaming();
  const validation = useFormValidation();
  const live = React.useContext(LiveValidationContext);
  const label = React.useContext(FieldLabelContext);
  const fallbackId = React.useId();
  const items = array(props.items).map(nodeProps);
  const defaults = React.useMemo(
    () =>
      props.defaultValue ??
      (name === "Slider"
        ? [props.min ?? 0]
        : name === "CheckBoxGroup" || name === "SwitchGroup"
          ? Object.fromEntries(
              array(props.items)
                .map(nodeProps)
                .map((item) => [text(item.name), item.defaultChecked === true]),
            )
          : name === "Chips" || name === "OptionCards"
            ? props.type === "multiple"
              ? []
              : ""
            : ""),
    [props.defaultValue, props.min, props.items, props.type, name],
  );
  const value = field.value ?? defaults;
  const rules = React.useMemo(
    () =>
      parseStructuredRules(
        props.rules as Parameters<typeof parseStructuredRules>[0],
      ),
    [props.rules],
  );
  React.useEffect(() => {
    if (!streaming && field.value === undefined && defaults !== "")
      field.setValue(defaults);
  }, [streaming, field, defaults]);
  React.useEffect(() => {
    if (streaming || !validation || !rules.length) return;
    validation.registerField(field.name, rules, () => value);
    return () => validation.unregisterField(field.name);
  }, [streaming, validation, rules, field.name, value]);
  // A value can arrive after the field first renders (a declared $variable
  // the store has not applied yet), so this runs on every change, not once.
  React.useEffect(() => {
    if (live && !streaming && validation && rules.length)
      validation.validateField(field.name, value, rules);
  }, [live, streaming, validation, rules, field.name, value]);
  const error = validation?.getFieldError(field.name);
  const id = label?.id ?? fallbackId;
  const common = {
    id,
    name: field.name,
    disabled: streaming,
    "aria-label": label?.label ?? text(props.label ?? props.name),
    "aria-describedby":
      [label?.hintId, error && `${id}-error`].filter(Boolean).join(" ") ||
      undefined,
    "aria-invalid": !!error,
    // Announced before a submit, not only after one fails.
    "aria-required": record(props.rules).required === true || undefined,
  };
  const change = (next: unknown) => {
    field.setValue(next);
    if (rules.length) validation?.validateField(field.name, next, rules);
  };
  let control: React.ReactNode;
  switch (name) {
    case "Input":
      control = (
        <Input
          {...common}
          type={text(props.type) || "text"}
          placeholder={text(props.placeholder)}
          value={text(value)}
          onChange={(event) => change(event.target.value)}
        />
      );
      break;
    case "TextArea":
      control = (
        <Textarea
          {...common}
          rows={typeof props.rows === "number" ? props.rows : 3}
          placeholder={text(props.placeholder)}
          value={text(value)}
          onChange={(event) => change(event.target.value)}
        />
      );
      break;
    case "DatePicker": {
      const date = record(value);
      const parseDate = (value: unknown) => {
        if (!value) return undefined;
        const parsed = parseISO(text(value));
        return isValid(parsed) ? parsed : undefined;
      };
      control =
        props.mode === "range" ? (
          <DateRangePicker
            {...common}
            // No range is no value, so the picker offers nothing to clear.
            value={
              date.from || date.to
                ? { from: parseDate(date.from), to: parseDate(date.to) }
                : undefined
            }
            // A field like the Select and Input beside it: their height,
            // border, fill and regular-weight control text.
            className="h-[var(--hui-density-control-height,36px)] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] [font-size:var(--hui-font-size-control,13px)] [font-weight:var(--hui-font-weight-regular)] [letter-spacing:var(--hui-letter-spacing-control,-0.003em)] [line-height:var(--hui-line-height-control,16px)]"
            onValueChange={(range) =>
              change(
                range
                  ? {
                      from: range.from?.toISOString(),
                      to: range.to?.toISOString(),
                    }
                  : undefined,
              )
            }
          />
        ) : (
          <SingleDatePicker
            {...common}
            required={record(props.rules).required === true}
            value={text(value)}
            onValueChange={change}
          />
        );
      break;
    }
    case "Slider": {
      const values = sliderValues(value, props.min);
      control = (
        // The value reads at the end of the track, so nothing floats over the
        // label and the number never moves while the thumb does.
        <div className="flex items-center gap-3">
          <Slider
            {...common}
            min={Number(props.min)}
            max={Number(props.max)}
            step={Number(props.step ?? 1)}
            value={values}
            // A drag reports a bare number; store [n] like every other slider value.
            onValueChange={(next) => change(Array.isArray(next) ? next : [next])}
            getAriaLabel={() => common["aria-label"]}
            className="flex-1"
          />
          <output
            aria-hidden
            className="min-w-[4ch] shrink-0 text-right text-sm font-medium tabular-nums"
          >
            {values.map((n) => Number(n).toLocaleString()).join(" – ")}
          </output>
        </div>
      );
      break;
    }
    case "Select":
      control = (
        <Select value={text(value)} onValueChange={change} disabled={streaming}>
          <SelectTrigger {...common}>
            <SelectValue
              placeholder={text(props.placeholder) || "Select an option"}
            />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={text(item.value)} value={text(item.value)}>
                {text(item.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      break;
    case "RadioGroup":
      control = (
        <RadioGroup {...common} value={text(value)} onValueChange={change}>
          {items.map((item, index) => (
            <label key={text(item.value)} className={choiceRow}>
              <RadioGroupItem
                id={`${id}-${index}`}
                value={text(item.value)}
                aria-label={text(item.label)}
                aria-describedby={item.description ? `${id}-${index}-description` : undefined}
              />
              <span className="min-w-0">
                {text(item.label)}
                {item.description ? (
                  <span id={`${id}-${index}-description`} className={choiceDescription}>
                    {text(item.description)}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </RadioGroup>
      );
      break;
    case "CheckBoxGroup":
    case "SwitchGroup":
      control = (
        <fieldset
          id={id}
          disabled={streaming}
          aria-label={common["aria-label"]}
          aria-describedby={common["aria-describedby"]}
          aria-invalid={common["aria-invalid"]}
          className="grid gap-3"
        >
          {items.map((item, index) => {
            const Control = name === "SwitchGroup" ? Switch : Checkbox;
            return (
              <label key={text(item.name)} className={choiceRow}>
                <Control
                  id={`${id}-${index}`}
                  disabled={streaming}
                  aria-label={text(item.label ?? item.name)}
                  aria-describedby={item.description ? `${id}-${index}-description` : undefined}
                  checked={record(value)[text(item.name)] === true}
                  onCheckedChange={(checked) =>
                    change({ ...record(value), [text(item.name)]: checked })
                  }
                />
                <span className="min-w-0">
                  {text(item.label ?? item.name)}
                  {item.description ? (
                    <span id={`${id}-${index}-description`} className={choiceDescription}>
                      {text(item.description)}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </fieldset>
      );
      break;
    case "Chips":
    case "OptionCards": {
      const multiple = props.type === "multiple";
      // Option cards share a grid, so a row of them is one height; chips wrap.
      const choiceLayout =
        name === "OptionCards"
          ? "grid grid-cols-[repeat(auto-fill,minmax(min(12rem,100%),1fr))] gap-2"
          : "flex flex-wrap gap-2";
      const choices = items.map((item, index) => {
        const selected = multiple
          ? array(value).includes(item.value)
          : value === item.value;
        return (
          <label
            key={text(item.value)}
            data-selected={selected || undefined}
            className={cn(
              "flex min-w-0 cursor-pointer gap-2.5 rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)] text-sm motion-safe:[transition:var(--hui-transition-interactive)] hover:bg-[var(--hui-color-background-base-primary-hover)] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-60 has-data-disabled:hover:bg-transparent",
              name === "OptionCards" ? "items-start px-3.5 py-3 [&>:first-child]:mt-0.5 [&>:first-child]:shrink-0" : "items-center px-3 py-1.5",
              selected && cn(selectedChoice, "hover:bg-[var(--hui-color-background-neutral-primary)]"),
            )}
          >
            {multiple ? (
              <Checkbox
                id={`${id}-${index}`}
                aria-label={text(item.title ?? item.label)}
                aria-describedby={item.subtitle ? `${id}-${index}-description` : undefined}
                disabled={streaming || item.disabled === true}
                checked={selected}
                onCheckedChange={(checked) =>
                  change(
                    checked
                      ? [...array(value), item.value]
                      : array(value).filter((v) => v !== item.value),
                  )
                }
              />
            ) : (
              <RadioGroupItem
                id={`${id}-${index}`}
                value={text(item.value)}
                aria-label={text(item.title ?? item.label)}
                aria-describedby={item.subtitle ? `${id}-${index}-description` : undefined}
                disabled={streaming || item.disabled === true}
              />
            )}
            {renderNode(item.icon ?? item.topContent)}
            <span className="min-w-0">
              {text(item.title ?? item.label)}
              {item.subtitle ? (
                <span id={`${id}-${index}-description`} className={choiceDescription}>
                  {text(item.subtitle)}
                </span>
              ) : null}
            </span>
          </label>
        );
      });
      control = multiple ? (
        <fieldset
          id={id}
          disabled={streaming}
          aria-label={common["aria-label"]}
          aria-describedby={common["aria-describedby"]}
          className={choiceLayout}
        >
          {choices}
        </fieldset>
      ) : (
        <RadioGroup
          {...common}
          value={text(value)}
          onValueChange={change}
          className={choiceLayout}
        >
          {choices}
        </RadioGroup>
      );
      break;
    }
    default:
      throw new Error(`Unsupported generated field: ${name}`);
  }
  return (
    <div className="grid gap-2">
      {control}
      {error && (
        <p id={`${id}-error`} role="alert" className="m-0 text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
