/**
 * Lays out model-written HTML for reading: one element per line, indented by
 * nesting, with a tag's attributes on their own lines when it runs long, and
 * the code inside <script> and <style> broken at statements and rules. An
 * element holding only short text stays on one line (`<text>SYN</text>`).
 *
 * It changes only whitespace between tags and statements, never inside a
 * string, a <pre> or a <textarea>, so scripts run the same; text that ran
 * straight into an inline tag (`a<b>b</b>`) may gain a space. It is a reader,
 * not a validator: malformed markup comes out laid out as written.
 */

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr",
]);
/** Elements whose content is kept exactly as written. */
const VERBATIM = new Set(["pre", "textarea"]);
const INDENT = "  ";
const WIDTH = 100;

type Token =
  | { kind: "open"; name: string; text: string; selfClosing: boolean }
  | { kind: "close"; name: string; text: string }
  | { kind: "text"; text: string }
  | { kind: "raw"; name: string; open: string; body: string; close: string }
  | { kind: "other"; text: string };

/** The end of a tag starting at `start`, skipping `>` inside quoted attribute values. */
function tagEnd(html: string, start: number) {
  let quote = "";
  for (let i = start + 1; i < html.length; i++) {
    const char = html[i];
    if (quote) {
      if (char === quote) quote = "";
    } else if (char === '"' || char === "'") quote = char;
    else if (char === ">") return i;
  }
  return html.length - 1;
}

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] !== "<") {
      const next = html.indexOf("<", i);
      const end = next === -1 ? html.length : next;
      tokens.push({ kind: "text", text: html.slice(i, end) });
      i = end;
      continue;
    }
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i);
      const stop = end === -1 ? html.length : end + 3;
      tokens.push({ kind: "other", text: html.slice(i, stop) });
      i = stop;
      continue;
    }
    const end = tagEnd(html, i);
    const text = html.slice(i, end + 1);
    i = end + 1;
    const closing = /^<\/\s*([\w:-]+)/.exec(text);
    if (closing) {
      tokens.push({ kind: "close", name: closing[1].toLowerCase(), text });
      continue;
    }
    const opening = /^<([\w:-]+)/.exec(text);
    if (!opening) {
      tokens.push({ kind: "other", text });
      continue;
    }
    const name = opening[1].toLowerCase();
    const selfClosing = /\/\s*>$/.test(text) || VOID.has(name);
    if (!selfClosing && (name === "script" || name === "style" || VERBATIM.has(name))) {
      const closeAt = html.toLowerCase().indexOf(`</${name}`, i);
      const bodyEnd = closeAt === -1 ? html.length : closeAt;
      const closeEnd = closeAt === -1 ? html.length - 1 : tagEnd(html, closeAt);
      tokens.push({ kind: "raw", name, open: text, body: html.slice(i, bodyEnd), close: html.slice(bodyEnd, closeEnd + 1) });
      i = closeEnd + 1;
      continue;
    }
    tokens.push({ kind: "open", name, text, selfClosing });
  }
  return tokens;
}

/** A tag on one line, or with one attribute per line when that line would run past the width. */
function layoutTag(tag: string, depth: number): string[] {
  const pad = INDENT.repeat(depth);
  const flat = tag.replace(/\s+/g, " ");
  if (pad.length + flat.length <= WIDTH) return [pad + flat];
  const match = /^<(\/?[\w:-]+)([\s\S]*?)(\/?)>$/.exec(tag);
  if (!match) return [pad + flat];
  const attributes = match[2].match(/[^\s=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?/g) ?? [];
  if (attributes.length < 2) return [pad + flat];
  return [
    `${pad}<${match[1]}`,
    ...attributes.map((attribute) => pad + INDENT + attribute),
    `${pad}${match[3] ? "/>" : ">"}`,
  ];
}

/**
 * Breaks inline JavaScript at statements and braces, indenting by brace
 * depth. Strings, template literals and comments are copied untouched, and a
 * `;` inside parentheses (a `for` header) does not break the line.
 */
export function formatScript(code: string, depth = 0): string[] {
  const lines: string[] = [];
  let line = "";
  let braces = 0;
  let parens = 0;
  const push = () => {
    const trimmed = line.trim();
    if (trimmed) lines.push(INDENT.repeat(depth + Math.max(0, braces)) + trimmed);
    line = "";
  };
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (char === '"' || char === "'" || char === "`") {
      let j = i + 1;
      while (j < code.length && code[j] !== char) j += code[j] === "\\" ? 2 : 1;
      line += code.slice(i, j + 1);
      i = j;
    } else if (char === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i);
      const stop = end === -1 ? code.length : end;
      line += code.slice(i, stop);
      push();
      i = stop;
    } else if (char === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const stop = end === -1 ? code.length : end + 2;
      line += code.slice(i, stop);
      i = stop - 1;
    } else if (char === "(") {
      parens++;
      line += char;
    } else if (char === ")") {
      parens = Math.max(0, parens - 1);
      line += char;
    } else if (char === "{") {
      line += char;
      push();
      braces++;
    } else if (char === "}") {
      push();
      braces = Math.max(0, braces - 1);
      line += char;
      // `})`, `},`, `};` and `}.` continue the same line.
      if (!/^\s*[),;.]/.test(code.slice(i + 1))) push();
    } else if (char === ";" && parens === 0) {
      line += char;
      push();
    } else if (char === "\n") {
      push();
    } else {
      line += char;
    }
  }
  push();
  return lines;
}

/** Inline CSS, one declaration per line inside each rule. */
function formatStyle(css: string, depth: number): string[] {
  const lines: string[] = [];
  let level = depth;
  for (const part of css.split(/([{};])/)) {
    const trimmed = part.trim();
    if (part === "{") {
      lines[lines.length - 1] = `${lines[lines.length - 1] ?? INDENT.repeat(level)} {`;
      level++;
    } else if (part === "}") {
      level = Math.max(depth, level - 1);
      lines.push(INDENT.repeat(level) + "}");
    } else if (part === ";") {
      if (lines.length) lines[lines.length - 1] += ";";
    } else if (trimmed) {
      lines.push(INDENT.repeat(level) + trimmed);
    }
  }
  return lines;
}

export function formatHtml(html: string): string {
  const tokens = tokenize(html.trim());
  const lines: string[] = [];
  let depth = 0;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.kind === "text") {
      const text = token.text.replace(/\s+/g, " ").trim();
      if (text) lines.push(INDENT.repeat(depth) + text);
    } else if (token.kind === "other") {
      lines.push(INDENT.repeat(depth) + token.text.trim());
    } else if (token.kind === "raw") {
      lines.push(...layoutTag(token.open, depth));
      if (VERBATIM.has(token.name)) {
        // Whitespace is content here: the element is kept exactly as written.
        lines[lines.length - 1] += token.body + token.close;
        continue;
      }
      const body = token.name === "script" ? formatScript(token.body, depth + 1) : formatStyle(token.body, depth + 1);
      lines.push(...body);
      if (token.close) lines.push(INDENT.repeat(depth) + token.close);
    } else if (token.kind === "close") {
      depth = Math.max(0, depth - 1);
      lines.push(INDENT.repeat(depth) + token.text);
    } else {
      const text = tokens[index + 1];
      const close = tokens[index + 2];
      // An element holding only short text stays on one line.
      if (
        !token.selfClosing &&
        text?.kind === "text" &&
        close?.kind === "close" &&
        close.name === token.name
      ) {
        const inline = `${token.text}${text.text.replace(/\s+/g, " ").trim()}${close.text}`;
        if (INDENT.repeat(depth).length + inline.length <= WIDTH) {
          lines.push(INDENT.repeat(depth) + inline);
          index += 2;
          continue;
        }
      }
      lines.push(...layoutTag(token.text, depth));
      if (!token.selfClosing) depth++;
    }
  }
  return lines.join("\n");
}
