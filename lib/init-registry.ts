const STYLES = ["default", "crisp", "mono", "editorial"] as const;
const BASE_COLORS = [
  "neutral",
  "zinc",
  "stone",
  "mauve",
  "olive",
  "mist",
  "taupe",
] as const;
const MENU_ACCENTS = ["subtle", "bold"] as const;
const MENU_COLORS = [
  "default",
  "inverted",
  "default-translucent",
  "inverted-translucent",
] as const;
const RADII = ["default", "none", "small", "medium", "large"] as const;
const FONTS = {
  geist: {
    family: '"Geist", sans-serif',
    import:
      'url("https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap")',
    variable: "--font-sans",
  },
  inter: {
    family: '"Inter", sans-serif',
    import:
      'url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap")',
    variable: "--font-sans",
  },
  "jetbrains-mono": {
    family: '"JetBrains Mono", monospace',
    import:
      'url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap")',
    variable: "--font-mono",
  },
  "noto-sans": {
    family: '"Noto Sans", sans-serif',
    import:
      'url("https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap")',
    variable: "--font-sans",
  },
  "playfair-display": {
    family: '"Playfair Display", serif',
    import:
      'url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap")',
    variable: "--font-heading",
  },
} as const;

type Style = (typeof STYLES)[number];
type BaseColor = (typeof BASE_COLORS)[number];
type MenuAccent = (typeof MENU_ACCENTS)[number];
type MenuColor = (typeof MENU_COLORS)[number];
type Radius = (typeof RADII)[number];
type Font = keyof typeof FONTS;

export type InitConfig = {
  base: "base";
  style: Style;
  baseColor: BaseColor;
  theme: BaseColor;
  font: Font;
  fontHeading: Font | "inherit";
  rtl: boolean;
  pointer: boolean;
  menuAccent: MenuAccent;
  menuColor: MenuColor;
  radius: Radius;
};

const DEFAULT_CONFIG: InitConfig = {
  base: "base",
  style: "default",
  baseColor: "neutral",
  theme: "neutral",
  font: "geist",
  fontHeading: "inherit",
  rtl: false,
  pointer: false,
  menuAccent: "subtle",
  menuColor: "default",
  radius: "default",
};

const RADIUS_VALUES: Record<Radius, string> = {
  default: "0.525rem",
  none: "0",
  small: "0.45rem",
  medium: "0.625rem",
  large: "0.875rem",
};

const LIGHT_VARS = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.145 0 0)",
  card: "oklch(1 0 0)",
  "card-foreground": "oklch(0.145 0 0)",
  popover: "oklch(1 0 0)",
  "popover-foreground": "oklch(0.145 0 0)",
  primary: "oklch(15% 0 0)",
  "primary-foreground": "oklch(0.985 0 0)",
  secondary: "oklch(0.97 0 0)",
  "secondary-foreground": "oklch(15% 0 0)",
  muted: "oklch(0.97 0 0)",
  "muted-foreground": "oklch(0.4 0 0)",
  accent: "oklch(0.97 0 0)",
  "accent-foreground": "oklch(15% 0 0)",
  destructive: "oklch(59.579% 0.21554 24.733)",
  "destructive-foreground": "oklch(0.97 0.01 17)",
  border: "oklch(0.922 0 0)",
  input: "oklch(0.922 0 0)",
  ring: "oklch(0.708 0 0)",
  "chart-1": "oklch(0.646 0.222 41.116)",
  "chart-2": "oklch(0.6 0.118 184.704)",
  "chart-3": "oklch(0.398 0.07 227.392)",
  "chart-4": "oklch(0.828 0.189 84.429)",
  "chart-5": "oklch(0.769 0.188 70.08)",
  sidebar: "oklch(98% 0.00011 271.152)",
  "sidebar-foreground": "oklch(0.145 0 0)",
  "sidebar-primary": "oklch(15% 0 0)",
  "sidebar-primary-foreground": "oklch(0.985 0 0)",
  "sidebar-accent": "oklch(93% 0 0)",
  "sidebar-accent-foreground": "oklch(15% 0 0)",
  "sidebar-border": "oklch(0.922 0 0)",
  "sidebar-ring": "oklch(0.708 0 0)",
};

const DARK_VARS = {
  background: "oklch(14% 0 270)",
  foreground: "oklch(0.985 0 0)",
  card: "oklch(0.205 0 0)",
  "card-foreground": "oklch(0.985 0 0)",
  popover: "oklch(0.269 0 0)",
  "popover-foreground": "oklch(0.985 0 0)",
  primary: "oklch(0.922 0 0)",
  "primary-foreground": "oklch(0.18 0 0)",
  secondary: "oklch(0.269 0 0)",
  "secondary-foreground": "oklch(0.985 0 0)",
  muted: "oklch(0.269 0 0)",
  "muted-foreground": "oklch(0.708 0 0)",
  accent: "oklch(20% 0 71)",
  "accent-foreground": "oklch(0.985 0 0)",
  destructive: "oklch(0.704 0.191 22.216)",
  "destructive-foreground": "oklch(62.559% 0.22587 26.142)",
  border: "oklch(100% 0 271.152 / 0.075)",
  input: "oklch(1 0 0 / 15%)",
  ring: "oklch(0.556 0 0)",
  "chart-1": "oklch(0.488 0.243 264.376)",
  "chart-2": "oklch(0.696 0.17 162.48)",
  "chart-3": "oklch(0.769 0.188 70.08)",
  "chart-4": "oklch(0.627 0.265 303.9)",
  "chart-5": "oklch(0.645 0.246 16.439)",
  sidebar: "oklch(16% 0 270)",
  "sidebar-foreground": "oklch(0.985 0 0)",
  "sidebar-primary": "oklch(0.488 0.243 264.376)",
  "sidebar-primary-foreground": "oklch(0.985 0 0)",
  "sidebar-accent": "oklch(21% 0 0)",
  "sidebar-accent-foreground": "oklch(0.985 0 0)",
  "sidebar-border": "oklch(1 0 0 / 10%)",
  "sidebar-ring": "oklch(0.439 0 0)",
};

function enumValue<T extends string>(
  params: URLSearchParams,
  key: string,
  values: readonly T[],
  fallback: T,
) {
  const value = params.get(key) ?? fallback;
  return values.includes(value as T) ? (value as T) : null;
}

export function parseInitConfig(params: URLSearchParams) {
  const base = params.get("base") ?? DEFAULT_CONFIG.base;
  const style = enumValue(params, "style", STYLES, DEFAULT_CONFIG.style);
  const baseColor = enumValue(
    params,
    "baseColor",
    BASE_COLORS,
    DEFAULT_CONFIG.baseColor,
  );
  const theme = enumValue(
    params,
    "theme",
    BASE_COLORS,
    DEFAULT_CONFIG.theme,
  );
  const font = enumValue(
    params,
    "font",
    Object.keys(FONTS) as Font[],
    DEFAULT_CONFIG.font,
  );
  const fontHeading = enumValue(
    params,
    "fontHeading",
    ["inherit", ...Object.keys(FONTS)] as (Font | "inherit")[],
    DEFAULT_CONFIG.fontHeading,
  );
  const menuAccent = enumValue(
    params,
    "menuAccent",
    MENU_ACCENTS,
    DEFAULT_CONFIG.menuAccent,
  );
  const menuColor = enumValue(
    params,
    "menuColor",
    MENU_COLORS,
    DEFAULT_CONFIG.menuColor,
  );
  const radius = enumValue(params, "radius", RADII, DEFAULT_CONFIG.radius);

  if (
    base !== "base" ||
    !style ||
    !baseColor ||
    !theme ||
    !font ||
    !fontHeading ||
    !menuAccent ||
    !menuColor ||
    !radius
  ) {
    return { success: false as const, error: "Invalid preset configuration" };
  }

  return {
    success: true as const,
    data: {
      base,
      style,
      baseColor,
      theme,
      font,
      fontHeading,
      menuAccent,
      menuColor,
      radius,
      rtl: params.get("rtl") === "true",
      pointer: params.get("pointer") === "true",
    } satisfies InitConfig,
  };
}

function buildTheme(config: InitConfig) {
  const bodyFont = FONTS[config.font];
  const headingFont =
    config.fontHeading === "inherit" ? bodyFont : FONTS[config.fontHeading];

  return {
    theme: {
      [bodyFont.variable]: bodyFont.family,
      "--font-heading": headingFont.family,
    },
    light: {
      ...LIGHT_VARS,
      radius: RADIUS_VALUES[config.radius],
      ...(config.menuAccent === "bold"
        ? {
            accent: LIGHT_VARS.primary,
            "accent-foreground": LIGHT_VARS["primary-foreground"],
          }
        : {}),
    },
    dark: {
      ...DARK_VARS,
      ...(config.menuAccent === "bold"
        ? {
            accent: DARK_VARS.primary,
            "accent-foreground": DARK_VARS["primary-foreground"],
          }
        : {}),
    },
  };
}

function buildFontImports(config: InitConfig) {
  const imports = [FONTS[config.font].import];
  if (config.fontHeading !== "inherit" && config.fontHeading !== config.font) {
    imports.push(FONTS[config.fontHeading].import);
  }

  return Object.fromEntries(imports.map((value) => [`@import ${value}`, {}]));
}

export function buildRegistryBase(
  config: InitConfig,
  only: string | null = null,
) {
  const requestedParts = only
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const invalidPart = requestedParts?.find(
    (part) => part !== "theme" && part !== "font" && part !== "fonts",
  );

  if (invalidPart || (requestedParts && requestedParts.length === 0)) {
    throw new Error("Invalid only value. Use one or more of: theme, font");
  }

  const includeTheme = !requestedParts || requestedParts.includes("theme");
  const includeFont =
    !requestedParts ||
    requestedParts.includes("font") ||
    requestedParts.includes("fonts");
  const theme = buildTheme(config);

  if (requestedParts) {
    return {
      name: `${config.base}-${config.style}-${requestedParts.join("-")}`,
      extends: "none",
      type: "registry:base" as const,
      ...(includeTheme && {
        config: {
          menuColor: config.menuColor,
          menuAccent: config.menuAccent,
          tailwind: { baseColor: config.baseColor },
        },
      }),
      cssVars: {
        ...(includeTheme && { light: theme.light, dark: theme.dark }),
        ...(includeFont && { theme: theme.theme }),
      },
      ...(includeFont && { css: buildFontImports(config) }),
    };
  }

  return {
    $schema: "https://honestui.com/schema/registry-item.json",
    name: `${config.base}-${config.style}`,
    extends: "none",
    type: "registry:base" as const,
    config: {
      style: `${config.base}-${config.style}`,
      iconLibrary: "honestui/icons",
      rtl: config.rtl,
      menuColor: config.menuColor,
      menuAccent: config.menuAccent,
      tailwind: { baseColor: config.baseColor },
    },
    dependencies: [
      "@base-ui-components/react",
      "@base-ui/react",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "tw-animate-css",
    ],
    files: [
      {
        path: "utils.ts",
        type: "registry:lib" as const,
        content:
          'import { clsx, type ClassValue } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n',
      },
    ],
    cssVars: theme,
    css: {
      ...buildFontImports(config),
      '@import "tw-animate-css"': {},
      "@layer base": {
        "*": { "@apply border-border outline-ring/50": {} },
        body: { "@apply bg-background text-foreground": {} },
        ...(config.pointer
          ? {
              'button:not(:disabled), [role="button"]:not(:disabled)': {
                cursor: "pointer",
              },
            }
          : {}),
      },
    },
  };
}
