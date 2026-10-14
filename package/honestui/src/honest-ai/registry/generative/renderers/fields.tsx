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
import { array, nodeProps, record, text, type Props } from "./shared";
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
            value={{ from: parseDate(date.from), to: parseDate(date.to) }}
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
    case "Slider":
      control = (
        <Slider
          {...common}
          min={Number(props.min)}
          max={Number(props.max)}
          step={Number(props.step ?? 1)}
          value={sliderValues(value, props.min)}
          // A drag reports a bare number; store [n] like every other slider value.
          onValueChange={(next) => change(Array.isArray(next) ? next : [next])}
          getAriaLabel={() => common["aria-label"]}
          // Room for the value bubble, which sits above the thumb, below the label.
          className="mt-[var(--hui-space-8)]"
          showValue
        />
      );
      break;
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
            <label key={text(item.value)} className="flex items-center gap-3">
              <RadioGroupItem
                id={`${id}-${index}`}
                value={text(item.value)}
                aria-label={text(item.label)}
                aria-describedby={item.description ? `${id}-${index}-description` : undefined}
              />
              <span>
                {text(item.label)}
                {item.description ? (
                  <span id={`${id}-${index}-description`} className="block text-muted-foreground">
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
              <label key={text(item.name)} className="flex items-center gap-3">
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
                <span>
                  {text(item.label ?? item.name)}
                  {item.description ? (
                    <span id={`${id}-${index}-description`} className="block text-muted-foreground">
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
      const choices = items.map((item, index) => {
        const selected = multiple
          ? array(value).includes(item.value)
          : value === item.value;
        return (
          <label
            key={text(item.value)}
            className={
              "flex cursor-pointer items-center gap-2 rounded-md border p-3 " +
              (selected ? "bg-accent" : "")
            }
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
            <span>
              {text(item.title ?? item.label)}
              {item.subtitle ? (
                <span id={`${id}-${index}-description`} className="block text-muted-foreground">
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
          className="flex flex-wrap gap-3"
        >
          {choices}
        </fieldset>
      ) : (
        <RadioGroup
          {...common}
          value={text(value)}
          onValueChange={change}
          className="flex flex-wrap gap-3"
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
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
