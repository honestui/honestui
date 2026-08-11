"use client";

import * as React from "react";

import { BrushIcon, HistoryIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ColorChoice = "indigo" | "orange" | "mint" | "red" | "green" | "amber";
type TypographyChoice =
  "love-sans" | "system" | "mono" | "editorial" | "serif" | "technical";
type SpacingChoice =
  "dense" | "compact" | "balanced" | "comfortable" | "relaxed";
type RadiusChoice =
  "none" | "extra-small" | "small" | "medium" | "large" | "extra-large";
type EffectsChoice =
  "flat" | "minimal" | "balanced" | "elevated" | "expressive";
type ThemeStyle = "default" | "crisp" | "mono" | "editorial";

type ThemeCustomization = {
  color: ColorChoice;
  typography: TypographyChoice;
  spacing: SpacingChoice;
  radius: RadiusChoice;
  effects: EffectsChoice;
};

type ThemeCustomizationContextValue = {
  customization: ThemeCustomization;
  matchingStyle: ThemeStyle | "custom";
  applyStyle: (style: ThemeStyle) => void;
  updateCustomization: <Key extends keyof ThemeCustomization>(
    key: Key,
    value: ThemeCustomization[Key],
  ) => void;
  resetCustomization: () => void;
};

type SelectOption = {
  value: string;
  label: string;
  description?: string;
  swatch?: string;
};

const STORAGE_KEY = "honestui:docs-theme-customization:v1";
const PREVIEW_SELECTOR = '[data-slot="preview"]';
const PREVIEW_SCOPE_ATTRIBUTE = "data-docs-theme-preview";
const PREVIEW_SCOPE_SELECTOR = `[${PREVIEW_SCOPE_ATTRIBUTE}]`;
const PORTAL_CONTENT_SELECTOR = [
  '[data-slot$="-backdrop"]',
  '[data-slot$="-popup"]',
  '[data-slot$="-positioner"]',
  '[data-slot$="-viewport"]',
  '[role="dialog"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="tooltip"]',
].join(",");

const STYLE_PRESETS: Record<ThemeStyle, ThemeCustomization> = {
  default: {
    color: "indigo",
    typography: "love-sans",
    spacing: "balanced",
    radius: "medium",
    effects: "balanced",
  },
  crisp: {
    color: "indigo",
    typography: "system",
    spacing: "compact",
    radius: "small",
    effects: "minimal",
  },
  mono: {
    color: "mint",
    typography: "mono",
    spacing: "compact",
    radius: "small",
    effects: "minimal",
  },
  editorial: {
    color: "orange",
    typography: "editorial",
    spacing: "relaxed",
    radius: "large",
    effects: "expressive",
  },
};

const DEFAULT_CUSTOMIZATION = STYLE_PRESETS.default;

const STYLE_OPTIONS: SelectOption[] = [
  { value: "default", label: "Default", description: "Balanced product UI" },
  { value: "crisp", label: "Crisp", description: "Sharp, compact product UI" },
  { value: "mono", label: "Mono", description: "Technical, monospace UI" },
  {
    value: "editorial",
    label: "Editorial",
    description: "Warm, expressive reading UI",
  },
];

const COLOR_OPTIONS: SelectOption[] = [
  { value: "indigo", label: "Indigo", swatch: "oklch(0.5438 0.191 267.01)" },
  { value: "orange", label: "Orange", swatch: "oklch(0.6908 0.1909 45.02)" },
  { value: "mint", label: "Mint", swatch: "oklch(0.8696 0.0999 177.98)" },
  { value: "red", label: "Red", swatch: "oklch(0.6256 0.1933 23.03)" },
  { value: "green", label: "Green", swatch: "oklch(0.6406 0.1329 157.68)" },
  { value: "amber", label: "Amber", swatch: "oklch(0.8169 0.1639 75.84)" },
];

const TYPOGRAPHY_OPTIONS: SelectOption[] = [
  { value: "love-sans", label: "Love Sans" },
  { value: "system", label: "System Sans" },
  { value: "mono", label: "JetBrains Mono" },
  { value: "editorial", label: "Editorial" },
  { value: "serif", label: "Classic Serif" },
  { value: "technical", label: "Technical" },
];

const SPACING_OPTIONS: SelectOption[] = [
  { value: "dense", label: "Dense" },
  { value: "compact", label: "Compact" },
  { value: "balanced", label: "Balanced" },
  { value: "comfortable", label: "Comfortable" },
  { value: "relaxed", label: "Relaxed" },
];

const RADIUS_OPTIONS: SelectOption[] = [
  { value: "none", label: "None" },
  { value: "extra-small", label: "Extra small" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "extra-large", label: "Extra large" },
];

const EFFECTS_OPTIONS: SelectOption[] = [
  { value: "flat", label: "Flat" },
  { value: "minimal", label: "Minimal" },
  { value: "balanced", label: "Balanced" },
  { value: "elevated", label: "Elevated" },
  { value: "expressive", label: "Expressive" },
];

const COLOR_ATTRIBUTES: Record<
  ColorChoice,
  { accent?: string; gray?: string }
> = {
  indigo: {},
  orange: { accent: "orange", gray: "mauve" },
  mint: { accent: "mint", gray: "sage" },
  red: {},
  green: {},
  amber: {},
};

function semanticAccentProperties(source: "danger" | "success" | "attention") {
  return Object.fromEntries([
    ...Array.from({ length: 12 }, (_, index) => [
      `--hui-accent-${index + 1}`,
      `var(--hui-${source}-${index + 1})`,
    ]),
    ["--hui-accent-contrast", `var(--hui-${source}-contrast)`],
  ]);
}

const COLOR_PROPERTIES: Record<ColorChoice, Record<string, string>> = {
  indigo: {},
  orange: {},
  mint: {},
  red: semanticAccentProperties("danger"),
  green: semanticAccentProperties("success"),
  amber: semanticAccentProperties("attention"),
};

const TYPOGRAPHY_PROPERTIES: Record<
  TypographyChoice,
  Record<string, string>
> = {
  "love-sans": {},
  system: {
    "--hui-font-title":
      'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    "--hui-font-body":
      'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  mono: {
    "--hui-font-title": "var(--hui-font-mono)",
    "--hui-font-body": "var(--hui-font-mono)",
  },
  editorial: {
    "--hui-font-title": 'Georgia, "Times New Roman", serif',
    "--hui-font-body": "var(--hui-font-love-sans)",
  },
  serif: {
    "--hui-font-title": 'Georgia, "Times New Roman", serif',
    "--hui-font-body": 'Georgia, "Times New Roman", serif',
  },
  technical: {
    "--hui-font-title": "var(--hui-font-mono)",
    "--hui-font-body": "var(--hui-font-love-sans)",
  },
};

const SPACING_PROPERTIES: Record<SpacingChoice, Record<string, string>> = {
  dense: {
    "--hui-space-1": "1px",
    "--hui-space-2": "2px",
    "--hui-space-3": "4px",
    "--hui-space-4": "8px",
    "--hui-space-5": "12px",
    "--hui-space-6": "16px",
    "--hui-space-7": "18px",
    "--hui-space-8": "22px",
    "--hui-space-9": "26px",
    "--hui-space-10": "32px",
    "--hui-space-11": "38px",
    "--hui-space-12": "44px",
    "--hui-space-13": "52px",
    "--hui-space-14": "60px",
    "--hui-space-15": "68px",
    "--hui-space-16": "78px",
    "--hui-space-17": "96px",
  },
  compact: {
    "--hui-space-1": "2px",
    "--hui-space-2": "3px",
    "--hui-space-3": "6px",
    "--hui-space-4": "10px",
    "--hui-space-5": "14px",
    "--hui-space-6": "18px",
    "--hui-space-7": "20px",
    "--hui-space-8": "24px",
    "--hui-space-9": "28px",
    "--hui-space-10": "36px",
    "--hui-space-11": "42px",
    "--hui-space-12": "48px",
    "--hui-space-13": "56px",
    "--hui-space-14": "64px",
    "--hui-space-15": "72px",
    "--hui-space-16": "84px",
    "--hui-space-17": "104px",
  },
  balanced: {},
  comfortable: {
    "--hui-space-1": "2px",
    "--hui-space-2": "4px",
    "--hui-space-3": "9px",
    "--hui-space-4": "13px",
    "--hui-space-5": "17px",
    "--hui-space-6": "22px",
    "--hui-space-7": "26px",
    "--hui-space-8": "30px",
    "--hui-space-9": "34px",
    "--hui-space-10": "42px",
    "--hui-space-11": "50px",
    "--hui-space-12": "60px",
    "--hui-space-13": "68px",
    "--hui-space-14": "76px",
    "--hui-space-15": "86px",
    "--hui-space-16": "102px",
    "--hui-space-17": "126px",
  },
  relaxed: {
    "--hui-space-1": "2px",
    "--hui-space-2": "5px",
    "--hui-space-3": "10px",
    "--hui-space-4": "14px",
    "--hui-space-5": "18px",
    "--hui-space-6": "24px",
    "--hui-space-7": "28px",
    "--hui-space-8": "32px",
    "--hui-space-9": "36px",
    "--hui-space-10": "44px",
    "--hui-space-11": "52px",
    "--hui-space-12": "64px",
    "--hui-space-13": "72px",
    "--hui-space-14": "80px",
    "--hui-space-15": "92px",
    "--hui-space-16": "108px",
    "--hui-space-17": "132px",
  },
};

const RADIUS_PROPERTIES: Record<RadiusChoice, Record<string, string>> = {
  none: {
    "--hui-radius-1": "0",
    "--hui-radius-2": "0",
    "--hui-radius-3": "0",
    "--hui-radius-4": "0",
    "--hui-radius-5": "0",
    "--hui-radius-6": "0",
  },
  "extra-small": {
    "--hui-radius-1": "0.5px",
    "--hui-radius-2": "1px",
    "--hui-radius-3": "2px",
    "--hui-radius-4": "3px",
    "--hui-radius-5": "5px",
    "--hui-radius-6": "8px",
  },
  small: {
    "--hui-radius-1": "1px",
    "--hui-radius-2": "2px",
    "--hui-radius-3": "4px",
    "--hui-radius-4": "6px",
    "--hui-radius-5": "8px",
    "--hui-radius-6": "12px",
  },
  medium: {},
  large: {
    "--hui-radius-1": "4px",
    "--hui-radius-2": "8px",
    "--hui-radius-3": "12px",
    "--hui-radius-4": "16px",
    "--hui-radius-5": "24px",
    "--hui-radius-6": "32px",
  },
  "extra-large": {
    "--hui-radius-1": "6px",
    "--hui-radius-2": "12px",
    "--hui-radius-3": "18px",
    "--hui-radius-4": "24px",
    "--hui-radius-5": "32px",
    "--hui-radius-6": "40px",
  },
};

const EFFECTS_PROPERTIES: Record<EffectsChoice, Record<string, string>> = {
  flat: {
    "--hui-shadow-feather": "none",
    "--hui-shadow-soft": "none",
    "--hui-shadow-lifted": "none",
    "--hui-shadow-floating": "none",
    "--hui-blur-lg": "blur(0)",
    "--hui-blur-xl": "blur(0)",
    "--hui-scale-pressed": "1",
    "--hui-scale-pressed-strong": "1",
  },
  minimal: {
    "--hui-shadow-feather": "none",
    "--hui-shadow-soft": "0 0 0 0.5px var(--hui-color-border-base-primary)",
    "--hui-shadow-lifted":
      "0 0 0 0.5px var(--hui-color-border-base-primary), 0 2px 8px oklch(0 0 0 / 0.08)",
    "--hui-shadow-floating":
      "0 0 0 0.5px var(--hui-color-border-base-primary), 0 4px 16px oklch(0 0 0 / 0.12)",
    "--hui-blur-lg": "blur(0)",
    "--hui-blur-xl": "blur(0)",
    "--hui-scale-pressed": "0.99",
    "--hui-scale-pressed-strong": "0.97",
  },
  balanced: {},
  elevated: {
    "--hui-shadow-feather":
      "0 1px 2px oklch(0 0 0 / 0.1), 0 3px 8px oklch(0 0 0 / 0.06)",
    "--hui-shadow-soft":
      "0 2px 5px oklch(0 0 0 / 0.12), 0 7px 16px oklch(0 0 0 / 0.07)",
    "--hui-shadow-lifted":
      "0 3px 8px oklch(0 0 0 / 0.14), 0 12px 26px oklch(0 0 0 / 0.1)",
    "--hui-shadow-floating":
      "0 6px 16px oklch(0 0 0 / 0.18), 0 20px 44px oklch(0 0 0 / 0.14)",
    "--hui-blur-lg": "blur(3px)",
    "--hui-blur-xl": "blur(6px)",
    "--hui-scale-pressed": "0.975",
    "--hui-scale-pressed-strong": "0.93",
  },
  expressive: {
    "--hui-shadow-feather":
      "0 1px 2px oklch(0 0 0 / 0.12), 0 5px 12px oklch(0 0 0 / 0.08)",
    "--hui-shadow-soft":
      "0 2px 6px oklch(0 0 0 / 0.14), 0 8px 20px oklch(0 0 0 / 0.08)",
    "--hui-shadow-lifted":
      "0 4px 10px oklch(0 0 0 / 0.16), 0 14px 32px oklch(0 0 0 / 0.12)",
    "--hui-shadow-floating":
      "0 8px 20px oklch(0 0 0 / 0.2), 0 24px 56px oklch(0 0 0 / 0.18)",
    "--hui-blur-lg": "blur(4px)",
    "--hui-blur-xl": "blur(8px)",
    "--hui-scale-pressed": "0.97",
    "--hui-scale-pressed-strong": "0.92",
  },
};

const OWNED_PROPERTIES = Array.from(
  new Set(
    [
      ...Object.values(COLOR_PROPERTIES),
      ...Object.values(TYPOGRAPHY_PROPERTIES),
      ...Object.values(SPACING_PROPERTIES),
      ...Object.values(RADIUS_PROPERTIES),
      ...Object.values(EFFECTS_PROPERTIES),
    ].flatMap((properties) => Object.keys(properties)),
  ),
);
const OWNED_STYLE_PROPERTIES = [...OWNED_PROPERTIES, "font-family"];

const ThemeCustomizationContext =
  React.createContext<ThemeCustomizationContextValue | null>(null);

function isThemeCustomization(value: unknown): value is ThemeCustomization {
  if (!value || typeof value !== "object") return false;

  const customization = value as Record<string, unknown>;

  return (
    COLOR_OPTIONS.some((option) => option.value === customization.color) &&
    TYPOGRAPHY_OPTIONS.some(
      (option) => option.value === customization.typography,
    ) &&
    SPACING_OPTIONS.some((option) => option.value === customization.spacing) &&
    RADIUS_OPTIONS.some((option) => option.value === customization.radius) &&
    EFFECTS_OPTIONS.some((option) => option.value === customization.effects)
  );
}

function readStoredCustomization() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return DEFAULT_CUSTOMIZATION;

    const parsedValue: unknown = JSON.parse(storedValue);
    return isThemeCustomization(parsedValue)
      ? parsedValue
      : DEFAULT_CUSTOMIZATION;
  } catch {
    return DEFAULT_CUSTOMIZATION;
  }
}

function persistCustomization(customization: ThemeCustomization) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customization));
  } catch {
    // The live customization still works when browser storage is unavailable.
  }
}

function applyProperties(
  target: HTMLElement,
  properties: Record<string, string>,
) {
  Object.entries(properties).forEach(([property, value]) => {
    target.style.setProperty(property, value);
  });
}

function applyCustomization(
  target: HTMLElement,
  customization: ThemeCustomization,
) {
  OWNED_STYLE_PROPERTIES.forEach((property) =>
    target.style.removeProperty(property),
  );

  const colorAttributes = COLOR_ATTRIBUTES[customization.color];
  if (colorAttributes.accent) {
    target.dataset.accentColor = colorAttributes.accent;
  } else {
    delete target.dataset.accentColor;
  }
  if (customization.color !== "indigo") {
    target.dataset.theme = document.documentElement.dataset.theme ?? "light";
  } else {
    delete target.dataset.theme;
  }
  if (colorAttributes.gray) {
    target.dataset.grayColor = colorAttributes.gray;
  } else {
    delete target.dataset.grayColor;
  }

  target.setAttribute(PREVIEW_SCOPE_ATTRIBUTE, "");
  applyProperties(target, COLOR_PROPERTIES[customization.color]);
  applyProperties(target, TYPOGRAPHY_PROPERTIES[customization.typography]);
  target.style.setProperty("font-family", "var(--hui-font-body)");
  applyProperties(target, SPACING_PROPERTIES[customization.spacing]);
  applyProperties(target, RADIUS_PROPERTIES[customization.radius]);
  applyProperties(target, EFFECTS_PROPERTIES[customization.effects]);
}

function clearCustomization(target: HTMLElement) {
  OWNED_STYLE_PROPERTIES.forEach((property) =>
    target.style.removeProperty(property),
  );
  delete target.dataset.accentColor;
  delete target.dataset.grayColor;
  delete target.dataset.theme;
  target.removeAttribute(PREVIEW_SCOPE_ATTRIBUTE);
}

function getPreviewTargets() {
  return Array.from(document.querySelectorAll<HTMLElement>(PREVIEW_SELECTOR));
}

function getCustomizationTargets() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(PREVIEW_SCOPE_SELECTOR),
  );
}

function containsPortalContent(node: HTMLElement) {
  return (
    node.matches(PORTAL_CONTENT_SELECTOR) ||
    Boolean(node.querySelector(PORTAL_CONTENT_SELECTOR))
  );
}

function applyCustomizationToPreviewTree(
  node: Node,
  customization: ThemeCustomization,
) {
  if (!(node instanceof HTMLElement)) return;

  if (node.matches(PREVIEW_SELECTOR)) {
    applyCustomization(node, customization);
  }

  node
    .querySelectorAll<HTMLElement>(PREVIEW_SELECTOR)
    .forEach((preview) => applyCustomization(preview, customization));
}

function clearLegacyRootCustomization() {
  const root = document.documentElement;
  OWNED_STYLE_PROPERTIES.forEach((property) =>
    root.style.removeProperty(property),
  );
  delete root.dataset.accentColor;
  delete root.dataset.grayColor;
}

function findMatchingStyle(customization: ThemeCustomization) {
  const matchingEntry = Object.entries(STYLE_PRESETS).find(([, preset]) =>
    (Object.keys(preset) as (keyof ThemeCustomization)[]).every(
      (key) => preset[key] === customization[key],
    ),
  );

  return (matchingEntry?.[0] as ThemeStyle | undefined) ?? "custom";
}

export function DocsThemeCustomizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCustomizerOpen, setIsCustomizerOpen] = React.useState(false);
  const [customization, setCustomization] = React.useState<ThemeCustomization>(
    () =>
      typeof window === "undefined"
        ? DEFAULT_CUSTOMIZATION
        : readStoredCustomization(),
  );
  const customizationRef = React.useRef(customization);
  const interactionStartedInPreviewRef = React.useRef(false);

  React.useEffect(() => {
    clearLegacyRootCustomization();

    const updateInteractionOrigin = (event: Event) => {
      const target = event.target;
      interactionStartedInPreviewRef.current =
        target instanceof Element &&
        Boolean(
          target.closest(`${PREVIEW_SELECTOR},${PREVIEW_SCOPE_SELECTOR}`),
        );
    };
    const applyCurrentCustomization = (node: Node) =>
      applyCustomizationToPreviewTree(node, customizationRef.current);
    const previewObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          applyCurrentCustomization(node);

          if (
            interactionStartedInPreviewRef.current &&
            node instanceof HTMLElement &&
            !node.closest(PREVIEW_SELECTOR) &&
            containsPortalContent(node)
          ) {
            applyCustomization(node, customizationRef.current);
          }
        });
      });
    });
    const themeObserver = new MutationObserver(() => {
      getCustomizationTargets().forEach((target) =>
        applyCustomization(target, customizationRef.current),
      );
    });

    getPreviewTargets().forEach((preview) =>
      applyCustomization(preview, customizationRef.current),
    );
    previewObserver.observe(document.body, { childList: true, subtree: true });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    document.addEventListener("keydown", updateInteractionOrigin, true);
    document.addEventListener("pointerdown", updateInteractionOrigin, true);
    document.addEventListener("pointerover", updateInteractionOrigin, true);

    return () => {
      previewObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("keydown", updateInteractionOrigin, true);
      document.removeEventListener(
        "pointerdown",
        updateInteractionOrigin,
        true,
      );
      document.removeEventListener(
        "pointerover",
        updateInteractionOrigin,
        true,
      );
      getCustomizationTargets().forEach(clearCustomization);
      clearLegacyRootCustomization();
    };
  }, []);

  React.useEffect(() => {
    customizationRef.current = customization;
    getCustomizationTargets().forEach((target) =>
      applyCustomization(target, customization),
    );
    persistCustomization(customization);
  }, [customization]);

  const value = React.useMemo<ThemeCustomizationContextValue>(
    () => ({
      customization,
      matchingStyle: findMatchingStyle(customization),
      applyStyle: (style) => setCustomization(STYLE_PRESETS[style]),
      updateCustomization: (key, nextValue) =>
        setCustomization((current) => ({ ...current, [key]: nextValue })),
      resetCustomization: () => setCustomization(DEFAULT_CUSTOMIZATION),
    }),
    [customization],
  );

  return (
    <ThemeCustomizationContext.Provider value={value}>
      <Sheet
        open={isCustomizerOpen}
        onOpenChange={setIsCustomizerOpen}
        modal={false}
        disablePointerDismissal
      >
        {children}
        <DocsThemeCustomizationSheet />
      </Sheet>
    </ThemeCustomizationContext.Provider>
  );
}

function useThemeCustomization() {
  const context = React.useContext(ThemeCustomizationContext);
  if (!context) {
    throw new Error(
      "DocsThemeCustomizer must be used within DocsThemeCustomizationProvider",
    );
  }
  return context;
}

function CustomizerSelect({
  id,
  label,
  description,
  value,
  options,
  onValueChange,
}: {
  id: string;
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
}) {
  const selectedOption = options.find((option) => option.value === value);
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="grid gap-[var(--hui-space-2)]">
      <label
        htmlFor={id}
        className="text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [font-weight:var(--hui-font-weight-medium)]"
      >
        {label}
      </label>
      {description && (
        <p
          id={descriptionId}
          className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)] [line-height:var(--hui-line-height-mini)]"
        >
          {description}
        </p>
      )}
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) onValueChange(nextValue);
        }}
      >
        <SelectTrigger
          id={id}
          aria-label={label}
          aria-describedby={descriptionId}
          className="w-full"
        >
          <SelectValue>{selectedOption?.label ?? value}</SelectValue>
        </SelectTrigger>
        <SelectPopup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex min-w-0 items-center gap-[var(--hui-space-3)]">
                {option.swatch && (
                  <span
                    aria-hidden="true"
                    className="size-[var(--hui-space-5)] shrink-0 rounded-[var(--hui-radius-full)] border-[0.5px] border-[var(--hui-color-border-base-primary)]"
                    style={{ backgroundColor: option.swatch }}
                  />
                )}
                <span className="grid min-w-0 gap-[var(--hui-space-1)]">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-mini)]">
                      {option.description}
                    </span>
                  )}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  );
}

export function DocsThemeCustomizer() {
  return (
    <Button
      render={<SheetTrigger />}
      id="docs-theme-customizer-trigger"
      variant="secondary"
      size="sm"
      className="text-muted-foreground hover:text-foreground h-8 border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-2! text-xs duration-0 hover:bg-[var(--hui-color-background-base-primary-hover)]"
    >
      <BrushIcon />
      Customize
    </Button>
  );
}

function DocsThemeCustomizationSheet() {
  const {
    customization,
    matchingStyle,
    applyStyle,
    updateCustomization,
    resetCustomization,
  } = useThemeCustomization();

  const styleOptions =
    matchingStyle === "custom"
      ? [{ value: "custom", label: "Custom" }, ...STYLE_OPTIONS]
      : STYLE_OPTIONS;

  return (
    <SheetContent
      side="right"
      showBackdrop={false}
      finalFocus={() =>
        document.getElementById("docs-theme-customizer-trigger")
      }
      className="gap-0 border-l border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] shadow-[var(--hui-shadow-floating)] sm:max-w-[380px]"
    >
      <SheetHeader className="gap-[var(--hui-space-2)] border-b border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-7)] py-[var(--hui-space-6)] pe-[var(--hui-space-12)]">
        <SheetTitle className="text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-large)] [font-weight:var(--hui-font-weight-medium)] [letter-spacing:var(--hui-letter-spacing-large)] [line-height:var(--hui-line-height-large)]">
          Customize theme
        </SheetTitle>
        <SheetDescription className="text-[var(--hui-color-foreground-base-secondary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
          Changes apply to rendered component previews and are saved in this
          browser.
        </SheetDescription>
      </SheetHeader>
      <div className="grid min-h-0 flex-1 content-start gap-[var(--hui-space-7)] overflow-y-auto px-[var(--hui-space-7)] py-[var(--hui-space-7)]">
        <CustomizerSelect
          id="docs-theme-style"
          label="Style"
          description="Start with an Honest UI installer preset, then fine-tune it below."
          value={matchingStyle}
          options={styleOptions}
          onValueChange={(value) => {
            if (value !== "custom") applyStyle(value as ThemeStyle);
          }}
        />
        <div className="grid gap-[var(--hui-space-5)]">
          <CustomizerSelect
            id="docs-theme-color"
            label="Colors"
            value={customization.color}
            options={COLOR_OPTIONS}
            onValueChange={(value) =>
              updateCustomization("color", value as ColorChoice)
            }
          />
          <CustomizerSelect
            id="docs-theme-typography"
            label="Typography"
            value={customization.typography}
            options={TYPOGRAPHY_OPTIONS}
            onValueChange={(value) =>
              updateCustomization("typography", value as TypographyChoice)
            }
          />
          <CustomizerSelect
            id="docs-theme-spacing"
            label="Spacing"
            value={customization.spacing}
            options={SPACING_OPTIONS}
            onValueChange={(value) =>
              updateCustomization("spacing", value as SpacingChoice)
            }
          />
          <CustomizerSelect
            id="docs-theme-radius"
            label="Radius"
            value={customization.radius}
            options={RADIUS_OPTIONS}
            onValueChange={(value) =>
              updateCustomization("radius", value as RadiusChoice)
            }
          />
          <CustomizerSelect
            id="docs-theme-effects"
            label="Effects"
            value={customization.effects}
            options={EFFECTS_OPTIONS}
            onValueChange={(value) =>
              updateCustomization("effects", value as EffectsChoice)
            }
          />
        </div>
      </div>
      <SheetFooter className="flex-row items-center justify-between border-t border-[var(--hui-color-border-base-primary)] px-[var(--hui-space-7)] py-[var(--hui-space-5)]">
        <Button variant="ghost" size="sm" onClick={resetCustomization}>
          <HistoryIcon />
          Reset defaults
        </Button>
        <Button render={<SheetClose />} size="sm">
          Done
        </Button>
      </SheetFooter>
    </SheetContent>
  );
}
