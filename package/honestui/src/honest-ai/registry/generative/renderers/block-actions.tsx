"use client";
import * as React from "react";
import {
  Check as CheckIcon,
  Code as CodeIcon,
  Copy as CopyIcon,
  Download as DownloadIcon,
  ImageDown as ImageDownIcon,
  Maximize2 as ExpandIcon,
} from "honestui/icons";
import { Button } from "../../../components/ui/button.js";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.js";
import { ProseCodeBlock } from "../../ai/prose-code-block.js";
import { SyntaxLine, useSyntax } from "../../lib/prose-syntax-react.js";
import { formatHtml } from "./format-html";

/**
 * A cell a spreadsheet would run as a formula (=, +, @, a tab, carriage
 * return or line feed, their full-width forms, or a - that does not start a
 * plain signed value) gets a leading
 * apostrophe, the OWASP mitigation for CSV injection: model-written text
 * must not execute when the file is opened. Plain negative numbers stay
 * numbers, so -0.2 is still -0.2.
 */
function neutralize(cell: string) {
  // Full-width ＝＋－＠ are read as formulas by some spreadsheet locales.
  // A plain signed value ("-3.2%", "-$1,200", "+5%", "-1e3") is data, not a
  // formula, and stays as written.
  if (/^[+-]?[$€£¥]?\d[\d,]*(\.\d+)?(e[+-]?\d+)?%?$/i.test(cell)) return cell;
  const formula = /^[=+@\t\r\n＝＋＠－-]/.test(cell);
  return formula ? `'${cell}` : cell;
}

/** A visual's HTML laid out and highlighted, with the same header and Copy as any generated code. */
function ViewCode({ code }: { code: string }) {
  const formatted = React.useMemo(() => formatHtml(code), [code]);
  const syntax = useSyntax(formatted, "html");
  return (
    <ProseCodeBlock
      label="HTML"
      code={formatted}
      codeClassName="honest-syntax"
      renderLine={syntax ? (line, index) => (syntax.lines[index] ? <SyntaxLine tokens={syntax.lines[index]} /> : line) : undefined}
    />
  );
}

/** Rows as CSV, safe to open in a spreadsheet, quoting any cell that holds a comma, quote or line break. */
export function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map(neutralize)
        .map((cell) => (/[",\n\r]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell))
        .join(","),
    )
    .join("\n");
}

/** "Amount ($) by category" → "amount-by-category", for a downloaded file's name. */
export function fileName(label: string, extension: string) {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "data"}.${extension}`;
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // Older Safari can cancel a download whose URL is revoked at once.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The chart inside `figure` as a PNG that stands on its own: its title above
 * it, padding around it, the page's background behind it, at twice the
 * screen's resolution or more. ECharts draws to a canvas or an SVG.
 */
export async function chartPng(figure: HTMLElement, title = ""): Promise<Blob | null> {
  const page = getComputedStyle(document.body);
  const background = page.backgroundColor || "#fff";
  const foreground = page.color || "#000";
  const scale = Math.max(2, window.devicePixelRatio || 1);
  const source = figure.querySelector("canvas");
  let image: CanvasImageSource | null = source;
  let width = source?.clientWidth ?? 0;
  let height = source?.clientHeight ?? 0;
  if (!source) {
    const svg = figure.querySelector("svg[width][height], [role='img'] svg");
    if (!(svg instanceof SVGSVGElement)) return null;
    const box = svg.getBoundingClientRect();
    width = box.width;
    height = box.height;
    const markup = new XMLSerializer().serializeToString(svg);
    const loaded = new Image();
    loaded.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    await loaded.decode();
    image = loaded;
  }
  if (!image || !width || !height) return null;
  const padding = 20;
  const titleHeight = title ? 28 : 0;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round((width + padding * 2) * scale);
  canvas.height = Math.round((height + padding * 2 + titleHeight) * scale);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.scale(scale, scale);
  context.fillStyle = background;
  context.fillRect(0, 0, width + padding * 2, height + padding * 2 + titleHeight);
  if (title) {
    context.fillStyle = foreground;
    context.font = `500 14px ${page.fontFamily}`;
    context.textBaseline = "top";
    context.fillText(title, padding, padding);
  }
  context.drawImage(image, padding, padding + titleHeight, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

const COPIED_MILLISECONDS = 2000;

/**
 * Quiet controls for a generated chart or table: open it larger, copy or
 * download its figures, or save a chart as an image. Each control names the
 * block it acts on, so several in one reply can be told apart.
 */
export function BlockActions({
  label,
  scope,
  rows,
  png,
  expanded,
  code,
}: {
  /** What the block shows, such as its caption: the dialog title and file name. */
  label: string;
  /** What the controls act on when it is narrower than the block, such as "6 of 12 rows of …". */
  scope?: string;
  /** The code the block ran, for View code. */
  code?: string;
  /** Header row first. Omitted for a block with no figures to copy. */
  rows?: () => string[][];
  /** Omitted for a block that is not a picture. */
  png?: () => Promise<Blob | null>;
  /** The block drawn again for the larger view. Omitted for no Expand. */
  expanded?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [codeOpen, setCodeOpen] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const announce = (message: string) => {
    setStatus(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(""), COPIED_MILLISECONDS);
  };
  const name = label || "data";
  const target = scope || name;

  return (
    <div data-slot="block-actions" className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
      {expanded && (
        <Button
          variant="link"
          size="icon-sm"
          aria-label={`Expand ${target}`}
          title="Expand"
          // A phone's dialog is no larger than the block itself.
          className="max-sm:hidden"
          onClick={() => setOpen(true)}
        >
          <ExpandIcon aria-hidden="true" />
        </Button>
      )}
      {rows && (
        <>
          <Button
            variant="link"
            size="icon-sm"
            aria-label={`Copy ${target} as CSV`}
            title="Copy as CSV"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(toCsv(rows()));
                announce("Copied");
              } catch {
                announce("Copy failed");
              }
            }}
          >
            {status === "Copied" ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
          </Button>
          <Button
            variant="link"
            size="icon-sm"
            aria-label={`Download ${target} as CSV`}
            title="Download CSV"
            onClick={() =>
              save(new Blob([toCsv(rows())], { type: "text/csv;charset=utf-8" }), fileName(name, "csv"))
            }
          >
            <DownloadIcon aria-hidden="true" />
          </Button>
        </>
      )}
      {png && (
        <Button
          variant="link"
          size="icon-sm"
          aria-label={`Download ${target} as an image`}
          title="Download image"
          onClick={async () => {
            try {
              const blob = await png();
              if (blob) save(blob, fileName(name, "png"));
              else announce("The image couldn’t be made");
            } catch {
              announce("The image couldn’t be made");
            }
          }}
        >
          <ImageDownIcon aria-hidden="true" />
        </Button>
      )}
      {code && (
        <Button
          variant="link"
          size="icon-sm"
          aria-label={`View code for ${name}`}
          title="View code"
          onClick={() => setCodeOpen(true)}
        >
          <CodeIcon aria-hidden="true" />
        </Button>
      )}
      <span role="status" className="sr-only">
        {status}
      </span>
      {code && (
        <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
          <DialogContent className="w-[min(56rem,92vw)] max-h-[90dvh]">
            <DialogHeader>
              <DialogTitle>{name}: code</DialogTitle>
            </DialogHeader>
            <DialogBody className="min-h-0 overflow-auto">
              <ViewCode code={code} />
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}
      {expanded && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[min(64rem,92vw)] max-h-[90dvh]">
            <DialogHeader>
              <DialogTitle>{name}</DialogTitle>
            </DialogHeader>
            <DialogBody className="min-h-0 overflow-auto">{open && expanded}</DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
