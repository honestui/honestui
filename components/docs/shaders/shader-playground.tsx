"use client";

import { Plus, RotateCcw, X } from "honestui/icons";
import * as React from "react";
import { createPortal } from "react-dom";

import {
  useComponentPreviewPlaygroundPortal,
  useComponentPreviewSource,
} from "@/components/docs/component/component-preview-source-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type ShaderCodePrimitive = string | number | boolean;
export type ShaderCodeValue = ShaderCodePrimitive | readonly ShaderCodePrimitive[];
export type ShaderCodeProp = readonly [name: string, value: ShaderCodeValue];

const controlClassName = "min-w-0 py-2";

export function useShaderSettings<T extends object>(defaults: T) {
  const [settings, setSettings] = React.useState<T>(defaults);

  const update = <K extends keyof T>(key: K, value: T[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const reset = () => setSettings(defaults);

  return { settings, update, reset };
}

export function hexToNormalizedRgb(hex: string): [number, number, number] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return [1, 1, 1];
  return [1, 2, 3].map((index) => Number((parseInt(match[index], 16) / 255).toFixed(3))) as [
    number,
    number,
    number,
  ];
}

function serializeCodeValue(value: ShaderCodeValue): string {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number") return String(Number(value.toFixed(4)));
  if (typeof value === "boolean") return String(value);

  return `[${value.map((item) => serializeCodeValue(item)).join(", ")}]`;
}

export function buildShaderCode({
  componentName,
  props,
  supportsClassName = true,
}: {
  componentName: string;
  props: readonly ShaderCodeProp[];
  supportsClassName?: boolean;
}) {
  const attributes = [
    ...(supportsClassName ? [`    className="size-full"`] : []),
    ...props.map(([name, value]) => {
      if (typeof value === "string") return `    ${name}=${serializeCodeValue(value)}`;
      return `    ${name}={${serializeCodeValue(value)}}`;
    }),
  ];

  return `import { ${componentName} } from "honestui/shaders"

export function Demo() {
  return (
    <div className="h-96 overflow-hidden rounded-xl">
      <${componentName}
${attributes.join("\n")}
      />
    </div>
  )
}`;
}

export function ShaderPlayground({
  title,
  code,
  preview,
  onReset,
  children,
}: {
  title: string;
  code: string;
  preview: React.ReactNode;
  onReset: () => void;
  children: React.ReactNode;
}) {
  useComponentPreviewSource(code);
  const playgroundPortal = useComponentPreviewPlaygroundPortal();

  const controls = (
    <section aria-label={`${title} controls`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-medium">Customize</h3>
          <p className="text-muted-foreground text-sm">
            Changes update the preview and generated code.
          </p>
        </div>
        <Button
          onClick={onReset}
          size="sm"
          variant="outline"
        >
          <RotateCcw />
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">{children}</div>
    </section>
  );

  return (
    <>
      <div className="h-64 w-full overflow-hidden sm:h-90">{preview}</div>
      {playgroundPortal ? createPortal(controls, playgroundPortal) : null}
    </>
  );
}

export function ShaderSliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
}) {
  const precision = Math.max(0, step.toString().split(".")[1]?.length ?? 0);
  const displayValue = formatValue?.(value) ?? String(Number(value.toFixed(precision)));

  return (
    <div className={cn(controlClassName, className)}>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium">{label}</span>
        <output className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
          {displayValue}
        </output>
      </div>
      <Slider
        aria-label={label}
        className="h-8"
        max={max}
        min={min}
        onValueChange={(nextValue) => {
          const scalarValue =
            typeof nextValue === "number" ? nextValue : nextValue[0];
          onChange(Number(scalarValue.toFixed(precision)));
        }}
        size="small"
        step={step}
        value={value}
      />
    </div>
  );
}

export function ShaderSwitchControl({
  label,
  checked,
  onChange,
  className,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  const id = React.useId();

  return (
    <div className={cn(controlClassName, "flex min-h-14 items-center justify-between gap-3", className)}>
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <Switch checked={checked} id={id} onCheckedChange={onChange} />
    </div>
  );
}

export function ShaderSelectControl({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: readonly { label: string; value: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = React.useId();
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  return (
    <div className={cn(controlClassName, className)}>
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <Select
        onValueChange={(nextValue) => {
          if (nextValue !== null) onChange(nextValue);
        }}
        value={value}
      >
        <SelectTrigger id={id} size="medium" className="w-full">
          <SelectValue>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectPopup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  );
}

export function ShaderTextControl({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = React.useId();

  return (
    <div className={cn(controlClassName, className)}>
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        onChange={(event) => onChange(event.target.value)}
        size="sm"
        type="url"
        value={value}
      />
    </div>
  );
}

export function ShaderColorControl({
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return <ShaderColorControlInner key={props.value} {...props} />;
}

function ShaderColorControlInner({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = React.useId();
  const [draft, setDraft] = React.useState(value);
  const isValid = /^#[0-9a-f]{6}$/i.test(draft);

  const commitDraft = (nextValue: string) => {
    setDraft(nextValue);
    if (/^#[0-9a-f]{6}$/i.test(nextValue)) onChange(nextValue.toLowerCase());
  };

  return (
    <div className={cn(controlClassName, className)}>
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          aria-label={`${label} picker`}
          className="border-input bg-background size-8 shrink-0 cursor-pointer rounded-md border p-0.5"
          onChange={(event) => commitDraft(event.target.value)}
          type="color"
          value={isValid ? draft : value}
        />
        <Input
          aria-invalid={!isValid || undefined}
          className="min-w-0"
          id={id}
          onBlur={() => {
            if (!isValid) setDraft(value);
          }}
          onChange={(event) => commitDraft(event.target.value)}
          size="sm"
          spellCheck={false}
          value={draft}
        />
      </div>
    </div>
  );
}

export function ShaderColorListControl({
  label,
  values,
  onChange,
  minColors = 2,
  maxColors = 8,
}: {
  label: string;
  values: readonly string[];
  onChange: (values: string[]) => void;
  minColors?: number;
  maxColors?: number;
}) {
  return (
    <div
      aria-label={label}
      className="col-span-2 min-w-0 py-2"
      role="group"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <Button
          aria-label={`Add ${label.toLowerCase()}`}
          disabled={values.length >= maxColors}
          onClick={() => onChange([...values, values.at(-1) ?? "#ffffff"])}
          size="xs"
          variant="outline"
        >
          <Plus />
          Add color
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {values.map((value, index) => (
          <div className="relative" key={`${index}-${values.length}`}>
            <ShaderColorControl
              className="h-full"
              label={`Color ${index + 1}`}
              onChange={(nextValue) => {
                const nextValues = [...values];
                nextValues[index] = nextValue;
                onChange(nextValues);
              }}
              value={value}
            />
            {values.length > minColors && (
              <button
                aria-label={`Remove color ${index + 1}`}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-2 right-2 flex size-7 items-center justify-center rounded-md outline-none focus-visible:ring-2"
                onClick={() => onChange(values.filter((_, valueIndex) => valueIndex !== index))}
                type="button"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
