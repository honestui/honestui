import { describe, expect, it } from "vitest";
import { honestChatLibrary } from "@/registry/honest-ai/generative";
import { createParser } from "@/registry/honest-ai/generative/runtime/core";
import { unescapeLoose } from "@/registry/honest-ai/generative/runtime/core/parser/lexer";

const parser = createParser(honestChatLibrary.toJSONSchema(), "Stack");
const htmlOf = (program: string) =>
  (parser.parse(program).root?.props as { children: { props: { html: string } }[] }).children[0].props.html;

describe("string escapes JSON rejects", () => {
  it("still unescapes quotes when the string holds a raw line break", () => {
    const html = htmlOf(`root = Stack([v])
v = HtmlVisual("Steps", "<svg viewBox=\\"0 0 10 10\\">
<text x=\\"1\\">SYN</text></svg>")`);
    expect(html).toBe('<svg viewBox="0 0 10 10">\n<text x="1">SYN</text></svg>');
  });

  it("reads \\' and drops a line-continuation backslash", () => {
    const html = htmlOf(`root = Stack([v])
v = HtmlVisual("Steps", "<b class=\\"a\\">it\\'s</b>\\
<i>next</i>")`);
    expect(html).toBe('<b class="a">it\'s</b><i>next</i>');
  });

  it("keeps JSON escapes and unknown escapes as their character", () => {
    expect(unescapeLoose('a\\"b\\\\c\\nd\\u0041\\qe')).toBe('a"b\\c\ndAqe');
  });

  it("drops a lone trailing backslash from a stream cut mid-escape", () => {
    expect(unescapeLoose("abc\\")).toBe("abc");
  });
});
