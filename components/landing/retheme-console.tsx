"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Check, Copy } from "honestui/icons"

import styles from "@/components/landing/landing.module.css"
import { CodeTokens } from "@/components/landing/code-tokens"
import {
  ACCENTS,
  DENSITIES,
  GRAYS,
  useMounted,
  useThemeScope,
} from "@/components/landing/theme-scope"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  renderOption,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  renderOption?: (option: { value: T; label: string }) => React.ReactNode
}) {
  return (
    <fieldset className={styles.consoleRow}>
      <legend>{label}</legend>
      <div className={styles.segmented}>
        {options.map((option) => (
          <label data-checked={value === option.value || undefined} key={option.value}>
            <input
              checked={value === option.value}
              className="sr-only"
              name={label}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            {renderOption ? renderOption(option) : option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function RethemeConsole() {
  const { state, set, reset, isDefault } = useThemeScope()
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const [copied, setCopied] = useState(false)
  const [notify, setNotify] = useState(true)

  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(t)
  }, [copied])

  const attrs = [
    state.accent !== "indigo" && `data-accent-color="${state.accent}"`,
    state.gray !== "gray" && `data-gray-color="${state.gray}"`,
    state.density !== "default" && `data-density="${state.density}"`,
  ].filter(Boolean) as string[]
  const snippet = [
    `<html${attrs.length ? " " + attrs.join(" ") : ""}>`,
    state.radius !== 1
      ? `  /* --hui-radius-2: ${Math.round(10 * state.radius * 10) / 10}px, and the rest of the scale ×${state.radius.toFixed(2)} */`
      : `  /* default radius scale */`,
  ].join("\n")

  return (
    <div className={styles.retheme}>
      <div className={styles.console} role="group" aria-labelledby="console-title">
        <div className={styles.consoleHead}>
          <span id="console-title">Theme for this page</span>
          <button
            className={styles.consoleReset}
            disabled={isDefault}
            onClick={reset}
            type="button"
          >
            Reset
          </button>
        </div>

        <Segmented
          label="Accent"
          onChange={(accent) => set({ accent })}
          options={ACCENTS}
          renderOption={(option) => (
            <>
              <span
                aria-hidden="true"
                className={styles.swatch}
                style={{ background: ACCENTS.find((a) => a.value === option.value)?.swatch }}
              />
              {option.label}
            </>
          )}
          value={state.accent}
        />
        <Segmented
          label="Neutral"
          onChange={(gray) => set({ gray })}
          options={GRAYS}
          value={state.gray}
        />
        <Segmented
          label="Density"
          onChange={(density) => set({ density })}
          options={DENSITIES.map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) }))}
          value={state.density}
        />

        <div className={styles.consoleRow}>
          <div className="flex items-center justify-between">
            <span className={styles.consoleLabel} id="radius-label">
              Radius
            </span>
            <span className={styles.consoleValue}>×{state.radius.toFixed(2)}</span>
          </div>
          <Slider
            aria-labelledby="radius-label"
            max={2}
            min={0}
            onValueChange={(value) => set({ radius: Array.isArray(value) ? value[0] : value })}
            size="small"
            step={0.05}
            value={state.radius}
          />
        </div>

        <label className={styles.consoleSwitch}>
          <span className={styles.consoleLabel}>Dark mode</span>
          <Switch
            checked={mounted && resolvedTheme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </label>

        <div className={styles.consoleCode}>
          <pre>
            <CodeTokens code={snippet} />
          </pre>
          <button
            aria-label="Copy theme attributes"
            className={styles.consoleCopy}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(snippet)
                setCopied(true)
              } catch {
                // Clipboard can be denied; the snippet stays selectable.
              }
            }}
            type="button"
          >
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </button>
          <span className="sr-only" role="status">
            {copied ? "Copied" : ""}
          </span>
        </div>
      </div>

      {/* Real components, reading the same tokens as the rest of the page. */}
      <div className={styles.specimens}>
        <div className={styles.specimen} data-span="2">
          <span className={styles.specimenLabel}>Button</span>
          <div className="flex flex-wrap gap-2">
            <Button>Deploy</Button>
            <Button variant="accent">Upgrade</Button>
            <Button variant="outline">Preview</Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </div>
        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>Badge</span>
          <div className="flex flex-wrap gap-2">
            <Badge>Live</Badge>
            <Badge variant="success">Passing</Badge>
            <Badge variant="warning">Review</Badge>
          </div>
        </div>
        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>Switch · Checkbox</span>
          <div className="flex items-center gap-4">
            <Switch checked={notify} onCheckedChange={setNotify} aria-label="Email alerts" />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox defaultChecked /> Weekly digest
            </label>
          </div>
        </div>
        <div className={styles.specimen} data-span="2">
          <span className={styles.specimenLabel}>Input</span>
          <div className="flex gap-2">
            <Input aria-label="Workspace name" defaultValue="acme-dashboard" />
            <Button variant="outline">Rename</Button>
          </div>
        </div>
        <div className={styles.specimen} data-span="2">
          <span className={styles.specimenLabel}>Progress</span>
          <Progress aria-label="Storage used" value={64} />
          <span className="text-xs text-[var(--hui-color-foreground-base-secondary)]">
            6.4 of 10 GB used
          </span>
        </div>
      </div>
    </div>
  )
}
