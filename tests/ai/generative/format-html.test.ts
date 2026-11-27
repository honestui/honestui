import { describe, expect, it } from "vitest";
import { formatHtml, formatScript } from "@/registry/honest-ai/generative/renderers/format-html";

describe("formatHtml", () => {
  it("indents nested elements and keeps short text elements on one line", () => {
    expect(formatHtml("<div><svg><text x='1'>SYN</text><line x1='0'/></svg></div>")).toBe(
      ["<div>", "  <svg>", "    <text x='1'>SYN</text>", "    <line x1='0'/>", "  </svg>", "</div>"].join("\n"),
    );
  });

  it("puts each attribute on its own line when a tag runs long", () => {
    const style = "padding:6px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface)";
    const lines = formatHtml(`<button id=n style='${style}'>Next</button>`).split("\n");
    expect(lines.slice(0, 4)).toEqual(["<button", "  id=n", `  style='${style}'`, ">"]);
  });

  it("does not split on a > inside an attribute value", () => {
    expect(formatHtml("<img alt='a > b' src=x>")).toBe("<img alt='a > b' src=x>");
  });

  it("keeps <pre> content exactly as written", () => {
    expect(formatHtml("<div><pre>  a\n    b</pre></div>")).toContain("<pre>  a\n    b</pre>");
  });

  it("lays out style rules one declaration per line", () => {
    expect(formatHtml("<style>.a{color:red;margin:0}</style>")).toBe(
      ["<style>", "  .a {", "    color:red;", "    margin:0", "  }", "</style>"].join("\n"),
    );
  });
});

describe("formatScript", () => {
  it("breaks at statements and braces but not inside strings or a for header", () => {
    expect(formatScript("for(let i=0;i<3;i++){go(i)};const s='a;{b}';")).toEqual([
      "for(let i=0;i<3;i++){",
      "  go(i)",
      "};",
      "const s='a;{b}';",
    ]);
  });

  it("keeps a closing brace with the call it ends", () => {
    expect(formatScript("list.forEach(g=>{g.hide()});")).toEqual(["list.forEach(g=>{", "  g.hide()", "});"]);
  });
});
