"use client";
import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "../../../lib/utils.js";
import { useIsStreaming } from "../runtime/react";
import { BlockActions } from "./block-actions";
import { canvasFit } from "./canvas-fit";
import { Button } from "../../../components/ui/button.js";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog.js";
import { safeUrl, text, type Props } from "./shared";

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 1600;
const HEIGHT_MESSAGE = "honest-visual:height";
const THEME_MESSAGE = "honest-visual:theme";
const BLOCKED_MESSAGE = "honest-visual:blocked";
const LOADED_MESSAGE = "honest-visual:loaded";
const LINK_MESSAGE = "honest-visual:link";

/**
 * Generated code runs only in two nested opaque-origin frames (no
 * allow-same-origin), so it cannot reach this page, its cookies or storage,
 * open windows, submit forms or download.
 *
 * - The inner frame holds the model's document. Its policy blocks every
 *   request a page policy can govern (fetch, images, fonts, sockets).
 * - The outer frame holds only the script below. Its `frame-src 'none'`
 *   lets the inner srcdoc load once and stops it navigating anywhere after
 *   (a frame's own navigation is outside its own CSP), so a visual cannot
 *   send data out in a URL or replace itself with another site. A link the
 *   reader clicks is offered to them to open in a new tab instead.
 *
 * Residual risks: Chromium does not let a page's policy block WebRTC (or,
 * historically, DNS prefetch), so a visual could still reach a STUN server
 * or trigger a DNS lookup; a visual that loops forever can
 * freeze the tab where the browser runs the frames in the page's process;
 * and a visual can post messages to the top window, so a host's own message
 * listeners must check their sender. Leave HtmlVisual out of your library if
 * these matter.
 */
const SANDBOX = "allow-scripts";
const INNER_POLICY = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "font-src data:",
  "media-src data: blob:",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");
// The inner srcdoc inherits this policy too, so it allows what the inner
// policy allows (inline code, data: media) and adds only frame-src 'none'.
const OUTER_POLICY = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "font-src data:",
  "media-src data: blob:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
].join("; ");

// Self-contained, so its source can run inside the visual's own document.
// Some compilers wrap named functions in a __name helper; it is defined here
// so the copied source runs without it.
const CANVAS_FIT = `(function () { var __name = function (target) { return target; }; (${canvasFit.toString()})(); })();`;

/** Page tokens a visual may use, so it matches the reply in either theme. */
const TOKENS = {
  "--background": "--hui-color-background-base-primary",
  "--surface": "--hui-color-background-base-secondary",
  "--foreground": "--hui-color-foreground-base-primary",
  "--muted": "--hui-color-foreground-base-secondary",
  "--border": "--hui-color-border-base-primary",
  "--accent": "--hui-color-background-accent-emphasis",
  "--accent-foreground": "--hui-color-foreground-accent-emphasis",
  "--chart-1": "--chart-1",
  "--chart-2": "--chart-2",
  "--chart-3": "--chart-3",
  "--chart-4": "--chart-4",
  "--chart-5": "--chart-5",
} as const;

function readTheme(): string {
  const style = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);
  const declarations = Object.entries(TOKENS)
    .map(([name, token]) => `${name}: ${style.getPropertyValue(token).trim() || "initial"};`)
    .join(" ");
  // The page's web font is sent in separately (see pageFont); until it
  // arrives, the system UI face stands in, closer to the chat than a serif.
  return `:root { ${declarations} --font: ${body.fontFamily}, system-ui, -apple-system, "Segoe UI", sans-serif; color-scheme: ${
    document.documentElement.dataset.theme === "dark" ? "dark" : "light"
  }; }`;
}

const unquote = (name: string) => name.trim().replace(/^["']|["']$/g, "");

let pageFontCss: Promise<string> | null = null;
/**
 * The page's own typeface, as @font-face rules with the files inlined, so a
 * visual's text matches the reply around it. The sandbox can't fetch fonts,
 * but it can use data: ones. One regular and one bold face of the body's
 * font, read once and shared by every visual; "" if none can be read.
 */
function pageFont(): Promise<string> {
  pageFontCss ??= (async () => {
    const family = unquote(getComputedStyle(document.body).fontFamily.split(",")[0] ?? "");
    const faces = new Map<string, { url: string; base: string }>();
    for (const sheet of document.styleSheets) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // Another origin's stylesheet can't be read.
      }
      for (const rule of rules) {
        if (!(rule instanceof CSSFontFaceRule)) continue;
        if (unquote(rule.style.getPropertyValue("font-family")) !== family) continue;
        if ((rule.style.getPropertyValue("font-style") || "normal") !== "normal") continue;
        const url = rule.style.getPropertyValue("src").match(/url\(["']?([^"')]+)["']?\)/)?.[1];
        const weight = rule.style.getPropertyValue("font-weight") || "400";
        if (url && !faces.has(weight)) faces.set(weight, { url, base: sheet.href ?? location.href });
      }
    }
    const regular = faces.get("400") ?? faces.get("normal");
    const bold = faces.get("600") ?? faces.get("700") ?? faces.get("bold");
    const chosen = [
      ...(regular ? [["400", regular] as const] : []),
      ...(bold ? [["600", bold] as const] : []),
    ];
    const rules = await Promise.all(
      chosen.map(async ([weight, face]) => {
        const blob = await (await fetch(new URL(face.url, face.base))).blob();
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        return `@font-face { font-family: ${JSON.stringify(family)}; src: url(${JSON.stringify(data)}); font-weight: ${weight}; }`;
      }),
    );
    return rules.join("\n");
  })().catch(() => "");
  return pageFontCss;
}

/**
 * The model's document: its policy, the page's tokens, a reporter that runs
 * before the model's markup (so even a cut-off visual reports itself), and
 * the visual.
 */
function innerDocument(html: string, theme: string) {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${INNER_POLICY}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style id="honest-theme">${theme}</style>
<style>
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; background: transparent; color: var(--foreground); font: 14px/1.5 var(--font); }
body { display: flow-root; }
button, input, select, textarea { font: inherit; color: inherit; }
/* Controls drawn like the app's own, at zero specificity so a visual's own styles win. */
:where(button) { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--foreground); font-weight: 500; font-size: 13px; cursor: pointer; transition: background-color 120ms, border-color 120ms; }
:where(button:hover:not(:disabled)) { border-color: color-mix(in oklab, var(--foreground) 22%, var(--border)); background: color-mix(in oklab, var(--foreground) 5%, var(--surface)); }
:where(button:active:not(:disabled)) { transform: scale(0.98); }
:where(button:disabled) { opacity: 0.5; cursor: default; }
:where(button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
:where(input:not([type]), input[type=text], input[type=number], input[type=search], select, textarea) { height: 32px; padding: 0 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); }
:where(textarea) { height: auto; padding: 6px 10px; }
:where(input[type=range], input[type=checkbox], input[type=radio], progress) { accent-color: var(--accent); }
:where(input[type=range]) { width: min(100%, 320px); margin: 4px 0; }
:where(label) { font-size: 13px; color: var(--muted); }
:where(canvas, svg, img) { max-width: 100%; }
:where(canvas) { display: block; border-radius: 8px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
<script>(function () {
  // Canvas can't read CSS variables: a fillStyle of "var(--foreground)" is
  // ignored and drawing stays black. Resolve the page's tokens first, so a
  // visual can color a canvas the way it colors its SVG and HTML.
  function resolve(value) {
    if (typeof value !== "string" || value.indexOf("var(") < 0) return value;
    var style = getComputedStyle(document.documentElement);
    return value.replace(/var\\(\\s*(--[\\w-]+)\\s*(?:,\\s*([^)]+))?\\)/g, function (_, name, fallback) {
      return style.getPropertyValue(name).trim() || (fallback || "").trim() || "currentcolor";
    });
  }
  ["fillStyle", "strokeStyle", "shadowColor"].forEach(function (key) {
    [window.CanvasRenderingContext2D, window.OffscreenCanvasRenderingContext2D].forEach(function (Context) {
      var descriptor = Context && Object.getOwnPropertyDescriptor(Context.prototype, key);
      if (!descriptor || !descriptor.set) return;
      Object.defineProperty(Context.prototype, key, {
        configurable: true,
        get: descriptor.get,
        set: function (value) { descriptor.set.call(this, resolve(value)); },
      });
    });
  });
  if (window.CanvasGradient) {
    var addColorStop = CanvasGradient.prototype.addColorStop;
    CanvasGradient.prototype.addColorStop = function (offset, color) { return addColorStop.call(this, offset, resolve(color)); };
  }
  // A canvas drawing that runs past its edges zooms out to fit (see canvas-fit.ts).
  ${CANVAS_FIT}
  // The body's own height, not the document's, which is never less than
  // the frame and so would never let a visual shrink to its content.
  // The body's own height (it is a flow root, so its children's margins
  // count), which can shrink below the frame; and the document's overflow,
  // for anything placed outside the body.
  function post() {
    var root = document.documentElement;
    var body = document.body ? document.body.getBoundingClientRect().height : 0;
    var overflow = root.scrollHeight > root.clientHeight ? root.scrollHeight : 0;
    parent.postMessage({ type: "${HEIGHT_MESSAGE}", height: Math.ceil(Math.max(body, overflow)) }, "*");
  }
  post();
  new ResizeObserver(post).observe(document.documentElement);
  addEventListener("DOMContentLoaded", function () { new ResizeObserver(post).observe(document.body); });
  addEventListener("DOMContentLoaded", post);
  addEventListener("load", function () {
    post();
    // Only this document, not a page it was replaced by, can send this.
    parent.postMessage({ type: "${LOADED_MESSAGE}" }, "*");
  });
  addEventListener("message", function (event) {
    if (event.source === parent && event.data && event.data.type === "${THEME_MESSAGE}") {
      document.getElementById("honest-theme").textContent = String(event.data.css);
    }
  });
  // A srcdoc document resolves "#section" against the host page, so an
  // in-page link would leave the frame: keep it in the page. Any other link
  // goes to the host, which asks before opening it in a new tab, so the
  // visual itself never navigates.
  addEventListener("click", function (event) {
    var link = event.target && event.target.closest ? event.target.closest("a[href], a, area[href]") : null;
    var href = link ? link.getAttribute("href") || link.getAttribute("xlink:href") || link.getAttributeNS("http://www.w3.org/1999/xlink", "href") : null;
    if (!link || !href || event.defaultPrevented) return;
    event.preventDefault();
    if (href.charAt(0) === "#") {
      var id = decodeURIComponent(href.slice(1));
      var target = id ? document.getElementById(id) : null;
      if (target) target.scrollIntoView();
      return;
    }
    parent.postMessage({ type: "${LINK_MESSAGE}", href: href }, "*");
  }, true);
})();</script></head><body>${html}</body></html>`;
}

/** JSON that is safe inside a <script> element: no "</script>" or "<!--" can close it. */
function scriptString(value: string) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * The outer frame: it creates the inner frame, relays only the inner frame's
 * height and the page's theme, and replaces the visual with a notice if the
 * inner frame tries to load anything after its first document.
 */
function outerDocument(html: string, theme: string) {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${OUTER_POLICY}">
<style>${theme.match(/color-scheme: (\w+)/)?.[0] ? `:root { ${theme.match(/color-scheme: (\w+)/)?.[0]}; }` : ""} html, body { margin: 0; height: 100%; background: transparent; } iframe { display: block; width: 100%; height: 100%; border: 0; }</style>
</head><body><script>(function () {
  var frame = document.createElement("iframe");
  var loads = 0;
  var loaded = false;
  function block() {
    if (!frame.isConnected) return;
    frame.remove();
    parent.postMessage({ type: "${BLOCKED_MESSAGE}" }, "*");
  }
  // Our document says when it has loaded, even when its markup was cut off.
  // A frame load with no such word means the frame holds some other page (a
  // navigation during the first parse replaces the first load); a second
  // load means it navigated later.
  frame.addEventListener("load", function () {
    loads += 1;
    var count = loads;
    setTimeout(function () { if (count > 1 || !loaded) block(); }, 150);
  });
  frame.srcdoc = ${scriptString(innerDocument(html, theme))};
  document.body.appendChild(frame);
  addEventListener("message", function (event) {
    var data = event.data;
    if (!data) return;
    if (event.source === frame.contentWindow && data.type === "${LOADED_MESSAGE}") {
      loaded = true;
    } else if (event.source === frame.contentWindow && data.type === "${LINK_MESSAGE}") {
      // A real click in the visual activates this frame too; a script alone does not.
      if (navigator.userActivation && !navigator.userActivation.isActive) return;
      parent.postMessage({ type: "${LINK_MESSAGE}", href: String(data.href) }, "*");
    } else if (event.source === frame.contentWindow && data.type === "${HEIGHT_MESSAGE}") {
      parent.postMessage({ type: "${HEIGHT_MESSAGE}", height: data.height }, "*");
    } else if (event.source === parent && data.type === "${THEME_MESSAGE}" && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "${THEME_MESSAGE}", css: String(data.css) }, "*");
    }
  });
})();</script></body></html>`;
}

function VisualFrame({
  html,
  title,
  initialHeight,
  fixedHeight,
}: {
  html: string;
  title: string;
  initialHeight: number;
  /** A CSS height that overrides the reported one, for the expanded view. */
  fixedHeight?: string;
}) {
  const frame = React.useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = React.useState(initialHeight);
  const [blocked, setBlocked] = React.useState(false);
  // Bumped to draw a stopped visual again from its first state.
  const [attempt, setAttempt] = React.useState(0);
  const [link, setLink] = React.useState<string | null>(null);
  // The frame's script can send a link request without any click, and an
  // opaque frame cannot prove one happened. So a request counts only while
  // the reader is in the visual (a click or Tab put focus there), at most
  // once every few seconds, and not after the reader has declined twice.
  const lastPrompt = React.useRef(0);
  // Said when a link the reader clicked is held back by the limits below,
  // so a link that stops opening does not look broken.
  // "wait": within a few seconds of the last prompt, and clears itself.
  // "off": the reader declined twice; they can turn links back on.
  const [paused, setPaused] = React.useState<"wait" | "off" | null>(null);
  React.useEffect(() => {
    if (paused !== "wait") return;
    const timer = window.setTimeout(() => setPaused(null), 3000);
    return () => window.clearTimeout(timer);
  }, [paused]);
  const cancelLink = React.useRef<HTMLButtonElement>(null);
  const declined = React.useRef(0);
  const { resolvedTheme } = useTheme();
  // The theme the frame starts with. Later changes are sent in as messages,
  // so switching theme restyles a visual without restarting it.
  const [startTheme, setStartTheme] = React.useState("");
  // The page's typeface as inlined @font-face rules, once read, and whether
  // this frame has been sent the current theme and typeface.
  const font = React.useRef("");
  const fontSent = React.useRef(false);
  React.useEffect(() => {
    // Read a frame later, once next-themes has applied the theme to the page.
    let live = true;
    const id = requestAnimationFrame(() => {
      const css = readTheme();
      setStartTheme((current) => current || css);
      frame.current?.contentWindow?.postMessage({ type: THEME_MESSAGE, css: css + font.current }, "*");
    });
    // The page's typeface follows once it is read; a visual that loads
    // after that gets it with its first height report.
    void pageFont().then((face) => {
      font.current = face;
      if (live && face)
        frame.current?.contentWindow?.postMessage({ type: THEME_MESSAGE, css: readTheme() + face }, "*");
    });
    return () => {
      live = false;
      cancelAnimationFrame(id);
    };
  }, [resolvedTheme]);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only this frame's own window is ever listened to.
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as { type?: unknown; height?: unknown; href?: unknown } | null;
      if (data?.type === BLOCKED_MESSAGE) {
        setBlocked(true);
        return;
      }
      if (data?.type === LINK_MESSAGE) {
        // Only a web address is offered; anything else is not opened.
        const url = safeUrl(typeof data.href === "string" ? data.href : "");
        const now = Date.now();
        // Requests while the reader is elsewhere are dropped without a word.
        if (!url || document.activeElement !== frame.current) return;
        if (declined.current >= 2) {
          setPaused("off");
          return;
        }
        if (now - lastPrompt.current < 3000) {
          setPaused("wait");
          return;
        }
        setPaused(null);
        lastPrompt.current = now;
        setLink(url);
        return;
      }
      if (data?.type !== HEIGHT_MESSAGE || typeof data.height !== "number") return;
      // The first report says the visual is listening: the current theme
      // (which may have changed since the frame's source was made) and the
      // typeface go in now.
      if (!fontSent.current) {
        fontSent.current = true;
        frame.current?.contentWindow?.postMessage({ type: THEME_MESSAGE, css: readTheme() + font.current }, "*");
      }
      if (!Number.isFinite(data.height)) return;
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(data.height))));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const source = React.useMemo(
    () => (startTheme ? outerDocument(html, startTheme) : ""),
    [html, startTheme],
  );
  if (blocked)
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-3 rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] p-4 text-center text-sm text-muted-foreground"
        style={{ height: fixedHeight ?? initialHeight }}
      >
        <p className="m-0">This visual tried to open another page and was stopped.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setBlocked(false);
            // The new frame starts without the typeface; it goes in again
            // with that frame's first report.
            fontSent.current = false;
            setAttempt((current) => current + 1);
          }}
        >
          Show the visual again
        </Button>
      </div>
    );
  if (!source) return <div style={{ height: fixedHeight ?? initialHeight }} />;
  return (
    <>
    <Dialog
      open={link !== null}
      onOpenChange={(open) => {
        if (open) return;
        declined.current += 1;
        // Said at once, not on the next click that would be refused.
        if (declined.current >= 2) setPaused("off");
        setLink(null);
      }}
    >
      {/* Cancel takes focus, so a stray Enter never opens the page. */}
      <DialogContent className="w-[min(32rem,92vw)]" initialFocus={cancelLink}>
        <DialogHeader>
          <DialogTitle>Open this link?</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid gap-4">
          <p className="m-0 text-sm text-muted-foreground">
            The visual “{title}” links to a page outside this chat. It opens in a new tab.
          </p>
          <p className="m-0 rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] p-3 font-mono text-xs [overflow-wrap:anywhere]">
            {link}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (link) window.open(link, "_blank", "noopener,noreferrer");
                setLink(null);
              }}
            >
              Open in new tab
            </Button>
            <Button
              ref={cancelLink}
              variant="outline"
              onClick={() => {
                declined.current += 1;
                if (declined.current >= 2) setPaused("off");
                setLink(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
    {/* One live region, laid over the visual's corner and always present,
        so its words are announced and nothing shifts when they change. */}
    <div className="relative">
      <div
        role="status"
        className={cn(
          "pointer-events-none absolute inset-x-2 bottom-2 z-10 flex justify-start",
          !paused && "sr-only",
        )}
      >
        {paused && (
          <p className="pointer-events-auto m-0 flex flex-wrap items-center gap-2 rounded-[var(--hui-radius-2)] border border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] px-2.5 py-1.5 text-xs text-muted-foreground shadow-[var(--hui-shadow-feather)]">
            {paused === "wait"
              ? "Links from this visual are paused for a moment."
              : "Links from this visual are off because you declined them."}
            {paused === "off" && (
              <button
                type="button"
                className="cursor-pointer rounded-[var(--hui-radius-1)] underline underline-offset-2 outline-none hover:text-[var(--hui-color-foreground-base-primary)] focus-visible:[outline:var(--hui-focus-ring)]"
                onClick={() => {
                  declined.current = 0;
                  setPaused(null);
                }}
              >
                Turn links back on
              </button>
            )}
          </p>
        )}
      </div>
    <iframe
      key={attempt}
      ref={frame}
      title={title}
      sandbox={SANDBOX}
      srcDoc={source}
      referrerPolicy="no-referrer"
      loading="lazy"
      className="block w-full border-0 bg-transparent"
      style={{ height: fixedHeight ?? height }}
    />
    </div>
    </>
  );
}

/**
 * A freeform visual the model writes as HTML and SVG, for an explanation no
 * catalog component can draw. It runs isolated (see SANDBOX and POLICY) and
 * only once the block has finished arriving, so partial code never runs.
 */
export function GeneratedHtmlVisual({ props }: { props: Props }) {
  const streaming = useIsStreaming();
  const title = text(props.title) || "Visual";
  const description = text(props.description);
  const html = text(props.html);
  const requested = Number(props.height);
  const initialHeight = Number.isFinite(requested)
    ? Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, requested))
    : 320;

  return (
    // Drawn in the reply itself, like a picture, with no card around it
    // (a Card the model chose still frames it). The caption and the actions
    // sit under the visual, so they never cover any of it.
    <figure data-slot="generated-html-visual" className="m-0 grid min-w-0 gap-2">
      {streaming || !html ? (
        <div
          role="status"
          className="flex items-center justify-center rounded-[var(--hui-radius-2)] bg-[var(--hui-color-background-base-secondary)] text-sm text-muted-foreground motion-safe:animate-pulse"
          style={{ height: initialHeight }}
        >
          Drawing the visual…
        </div>
      ) : (
        <VisualFrame html={html} title={title} initialHeight={initialHeight} />
      )}
      <div className="flex min-h-8 items-center justify-between gap-3">
        <figcaption className="m-0 min-w-0 text-xs text-muted-foreground">
          <span className="font-medium text-[var(--hui-color-foreground-base-primary)]">{title}</span>
          {description && <span> · {description}</span>}
        </figcaption>
        {!streaming && html && (
          <BlockActions
            label={title}
            code={html}
            expanded={<VisualFrame html={html} title={title} initialHeight={initialHeight} fixedHeight="min(70vh, 48rem)" />}
          />
        )}
      </div>
    </figure>
  );
}
