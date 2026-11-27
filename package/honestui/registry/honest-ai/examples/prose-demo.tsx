"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { ChevronRight } from "honestui/icons"

import ProseSyntaxDemo from "@/registry/honest-ai/examples/prose-syntax-demo"

import { proseTailwind, proseTailwindClasses } from "@/registry/honest-ai/lib/prose-tailwind"

import { Button } from "@/registry/default/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/registry/default/ui/select"
import { useComponentPreviewPlaygroundPortal } from "@/components/docs/component/component-preview-source-context"

const controls = [
  { name: "--prose-size", label: "Size", min: 12, max: 20, step: 1, unit: "px" },
  { name: "--prose-leading", label: "Line height", min: 1.2, max: 2, step: 0.05, unit: "" },
  { name: "--prose-flow", label: "Block spacing", min: 4, max: 28, step: 2, unit: "px" },
  { name: "--prose-width", label: "Text width", min: 30, max: 90, step: 1, unit: "ch" },
  { name: "--prose-heading", label: "Heading size", min: 1, max: 2, step: 0.05, unit: "em" },
  { name: "--prose-tracking", label: "Letter spacing", min: -0.02, max: 0.12, step: 0.01, unit: "em" },
] as const

const radiusControl = { name: "--prose-radius", label: "Inline code radius", min: 0, max: 12, step: 1, unit: "px" } as const

type NumericName = (typeof controls)[number]["name"] | typeof radiusControl.name
type Values = Record<NumericName, number>

const presets: Record<string, Values> = {
  Chat: { "--prose-size": 14, "--prose-leading": 1.6, "--prose-flow": 12, "--prose-width": 60, "--prose-heading": 1.15, "--prose-tracking": 0, "--prose-radius": 6 },
  Document: { "--prose-size": 16, "--prose-leading": 1.7, "--prose-flow": 18, "--prose-width": 68, "--prose-heading": 1.5, "--prose-tracking": 0, "--prose-radius": 6 },
  Compact: { "--prose-size": 13, "--prose-leading": 1.45, "--prose-flow": 8, "--prose-width": 52, "--prose-heading": 1.15, "--prose-tracking": 0, "--prose-radius": 2 },
}

const colorControls = [
  { name: "--prose-syntax-keyword", label: "Syntax keywords" },
  { name: "--prose-syntax-string", label: "Syntax strings" },
  { name: "--prose-syntax-comment", label: "Syntax comments" },
  { name: "--prose-color", label: "Text color" },
  { name: "--prose-muted", label: "Quote and caption color" },
  { name: "--prose-surface", label: "Code block frame" },
  { name: "--prose-rule", label: "Table and divider color" },
  { name: "--prose-rule-strong", label: "Quote rule color" },
] as const

type ColorName = (typeof colorControls)[number]["name"]
const emptyColors = Object.fromEntries(colorControls.map(({ name }) => [name, ""])) as Record<ColorName, string>
const validColor = (value: string) => value === "" || /^#[0-9a-f]{6}$/i.test(value)
const fieldClass = "min-w-0 rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-2 py-1.5 text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)]"

/** Controls live outside the rendered HTML, in the docs playground. */
export default function ProseDemo() {
  const [values, setValues] = React.useState(presets.Chat)
  const [colors, setColors] = React.useState(emptyColors)
  const [codeFont, setCodeFont] = React.useState("")
  const [format, setFormat] = React.useState("css")
  const [copyStatus, setCopyStatus] = React.useState("")
  const id = React.useId()
  const playgroundPortal = useComponentPreviewPlaygroundPortal()

  const settings: Record<string, string> = Object.fromEntries(
    [...controls, radiusControl].map((control) => [control.name, `${values[control.name]}${control.unit}`])
  )
  for (const { name } of colorControls) {
    if (colors[name] && validColor(colors[name])) settings[name] = colors[name]
  }
  if (codeFont) settings["--prose-font-mono"] = codeFont
  const style = settings as React.CSSProperties
  const currentPreset = Object.entries(presets).find(([, preset]) =>
    Object.entries(preset).every(([name, value]) => values[name as NumericName] === value)
  )?.[0] ?? "Custom"
  const hasInvalidColor = Object.values(colors).some((color) => !validColor(color))
  const css = `.honest-prose {\n${Object.entries(settings).map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`

  const tailwindClasses = proseTailwindClasses(settings)
  const exportText = format === "css" ? css : tailwindClasses
  const exportLabel = format === "css" ? "CSS" : "Tailwind classes"

  function reset() {
    setValues(presets.Chat)
    setColors(emptyColors)
    setCodeFont("")
    setCopyStatus("")
  }

  async function copyCss() {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopyStatus(`${exportLabel} copied.`)
    } catch {
      setCopyStatus(`Copy failed. Select and copy the ${exportLabel} below.`)
    }
  }

  function slider(control: (typeof controls)[number] | typeof radiusControl) {
    return (
      <React.Fragment key={control.name}>
        <label htmlFor={`${id}${control.name}`}>{control.label}</label>
        <input
          id={`${id}${control.name}`}
          type="range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={values[control.name]}
          onChange={(event) => { setValues({ ...values, [control.name]: Number(event.target.value) }); setCopyStatus("") }}
          className="w-full min-w-0 accent-[var(--hui-color-foreground-base-primary)]"
        />
        <output htmlFor={`${id}${control.name}`} className="font-mono tabular-nums">
          {values[control.name]}{control.unit}
        </output>
      </React.Fragment>
    )
  }

  return (
    <>
      {playgroundPortal && createPortal(
        <fieldset className="m-0 min-w-0 rounded-[var(--hui-radius-3)] border border-[var(--hui-color-border-base-primary)] p-[var(--hui-space-5)] text-[var(--hui-color-foreground-base-primary)] [font-size:var(--hui-font-size-small)] [line-height:var(--hui-line-height-small)]">
          <legend className="px-[var(--hui-space-2)] font-medium">Customize Prose</legend>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <label htmlFor={`${id}-preset`}>Preset</label>
            <Select value={currentPreset} onValueChange={(value) => { if (value && presets[value]) setValues(presets[value]); setCopyStatus("") }}>
              <SelectTrigger id={`${id}-preset`} aria-label="Preset" size="sm" className="min-w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(presets).map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                <SelectItem value="Custom" disabled>Custom</SelectItem>
              </SelectContent>
            </Select>
            <label htmlFor={`${id}-format`}>Export</label>
            <Select items={{ css: "CSS", tailwind: "Tailwind" }} value={format} onValueChange={(value) => { if (value) setFormat(value); setCopyStatus("") }}>
              <SelectTrigger id={`${id}-format`} aria-label="Export" size="sm" className="min-w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="tailwind">Tailwind</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="secondary" size="sm" onClick={reset}>Reset</Button>
            <Button type="button" variant="secondary" size="sm" disabled={hasInvalidColor} onClick={() => void copyCss()}>Copy {exportLabel}</Button>
            <p role="status" className="m-0 min-w-0 text-[var(--hui-color-foreground-base-secondary)] empty:hidden">{copyStatus}</p>
          </div>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3">
            {controls.map(slider)}
          </div>
          <details className="group/advanced mt-5 border-t border-[var(--hui-color-border-base-primary)] pt-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-medium focus-visible:[outline:var(--hui-focus-ring)] [&::-webkit-details-marker]:hidden">
              <ChevronRight aria-hidden="true" focusable="false" className="size-4 shrink-0 group-open/advanced:rotate-90" />
              Advanced
            </summary>
            <p className="my-3 text-[var(--hui-color-foreground-base-secondary)]">Colors use six-digit hex values, such as #334155. Leave them blank to follow the theme. Check contrast after changing colors.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {colorControls.map(({ name, label }) => {
                const invalid = !validColor(colors[name])
                return (
                  <div key={name} className="flex min-w-0 flex-col gap-1.5">
                    <label htmlFor={`${id}${name}`}>{label}</label>
                    <input id={`${id}${name}`} value={colors[name]} placeholder="Theme default" spellCheck={false} className={fieldClass} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}${name}-error` : undefined} onChange={(event) => { setColors({ ...colors, [name]: event.target.value }); setCopyStatus("") }} />
                    {invalid && <p id={`${id}${name}-error`} className="m-0">Enter a color like #334155, or leave it blank.</p>}
                  </div>
                )
              })}
              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={`${id}-font`}>Code font</label>
                <Select items={{ theme: "Theme default", "ui-monospace, monospace": "System monospace", "Menlo, monospace": "Menlo", "Consolas, monospace": "Consolas" }} value={codeFont || "theme"} onValueChange={(value) => { setCodeFont(value === "theme" ? "" : value ?? ""); setCopyStatus("") }}>
                  <SelectTrigger id={`${id}-font`} aria-label="Code font" size="sm" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theme">Theme default</SelectItem>
                    <SelectItem value="ui-monospace, monospace">System monospace</SelectItem>
                    <SelectItem value="Menlo, monospace">Menlo</SelectItem>
                    <SelectItem value="Consolas, monospace">Consolas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">{slider(radiusControl)}</div>
          </details>
          <details className="group/css mt-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 focus-visible:[outline:var(--hui-focus-ring)] [&::-webkit-details-marker]:hidden">
              <ChevronRight aria-hidden="true" focusable="false" className="size-4 shrink-0 group-open/css:rotate-90" />
              View {exportLabel}
            </summary>
            <pre tabIndex={0} aria-label={`Custom Prose ${exportLabel}`} className="mt-3 overflow-x-auto rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] p-3 font-mono focus-visible:[outline:var(--hui-focus-ring)]"><code>{exportText}</code></pre>
          </details>
        </fieldset>,
        playgroundPortal
      )}

      <div className="grid min-h-[440px] w-full min-w-0 place-items-center p-4 sm:p-6">
        <article className={`${format === "css" ? "honest-prose" : proseTailwind} w-full min-w-0`} style={style} data-slot="prose-demo">
          <h2>How Prose spaces text</h2>
          <p>
            Every block takes its space from <code>--prose-flow</code>, as a margin above it.{" "}
            <strong>Nothing</strong> is spaced from below
            <sup><a href="#prose-demo-fn-1" id="prose-demo-fnref-1" data-footnote-ref aria-describedby="prose-demo-footnotes">1</a></sup>,
            so a block that arrives later does not move the ones before it. The{" "}
            <a href="#streaming">streaming notes</a> explain why.
          </p>
          <ul>
            <li>A heading sits closer to the block under it than to the one above.</li>
            <li>
              A list item is tighter than a paragraph.
              <ul>
                <li>A nested list changes its marker.</li>
              </ul>
            </li>
          </ul>
          <h3>Try it</h3>
          <ol>
            <li>Choose a preset in the panel below.</li>
            <li>
              Drag <strong>Block spacing</strong> and watch every gap follow it.
            </li>
            <li>
              Copy the settings, or select them and press <kbd>⌘</kbd> <kbd>C</kbd>.
            </li>
          </ol>
          <ul className="contains-task-list">
            <li className="task-list-item">
              <input type="checkbox" checked readOnly disabled aria-label="Done" /> Links stay underlined, so they
              never depend on color.
            </li>
            <li className="task-list-item">
              <input type="checkbox" readOnly disabled aria-label="Not done" /> Check contrast after changing
              colors.
            </li>
          </ul>
          <blockquote>
            <p>A quote is set in the muted color, behind a rule.</p>
          </blockquote>
          <table>
            <thead>
              <tr>
                <th>Variable</th>
                <th>Sets</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>--prose-size</code>
                </td>
                <td>Body text size</td>
              </tr>
              <tr>
                <td>
                  <code>--prose-leading</code>
                </td>
                <td>Body line height</td>
              </tr>
            </tbody>
          </table>
          <hr />
          <h2>Code that belongs in the document</h2>
          <p>A renderer without its own code component gets one quiet panel:</p>
          <pre>
            <code>{`.honest-prose {\n  --prose-flow: 12px;\n}`}</code>
          </pre>
          <p>Honest Prose Syntax adds color and a toolbar:</p>
          <ProseSyntaxDemo tailwind={format === "tailwind"} />
          <section data-footnotes>
            <h2 id="prose-demo-footnotes" className="sr-only">Footnotes</h2>
            <ol>
              <li id="prose-demo-fn-1">
                <p>
                  A heading’s closer spacing is set on the block under it, not on the heading.{" "}
                  <a href="#prose-demo-fnref-1" data-footnote-backref aria-label="Back to reference 1">↩</a>
                </p>
              </li>
            </ol>
          </section>
        </article>
      </div>
    </>
  )
}
