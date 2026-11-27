// HonestAI regression test. MIT; see registry/generative/LICENSE.
import { describe, expect, it } from "vitest";
import { buildMessage, parseMessage } from "../message";

describe("message protocol", () => {
  it("round trips content, context, attributes, and end", () => {
    const input = {
      content: 'root = Card([title])\ntitle = TextContent("a ]]>honestai:end")',
      context: [{ note: "rush" }],
      attributes: { library: "@acme/support@1.2.0", note: "a b!" },
      end: true,
    };
    const raw = buildMessage(input);
    expect(raw.split("\n")[0]).toBe(
      "]]>honestai:content?" + new URLSearchParams(input.attributes).toString(),
    );
    expect(parseMessage(raw)).toEqual(input);
    expect(parseMessage(`${raw}\n`).content).toBe(input.content);
  });

  it("keeps plain text byte for byte", () => {
    const plain = "Hi\r\n```honestai-lang\nroot = A()\n```\n";
    expect(parseMessage(plain)).toMatchObject({ content: plain, context: null, end: false });
  });

  it("uses the last content and keeps non-JSON context as text", () => {
    const raw =
      ']]>honestai:content\nold\n]]>honestai:context\n{}\n]]>honestai:content?v=2\nnew\r\n]]>honestai:context\n{"a":';
    expect(parseMessage(raw)).toEqual({
      content: "new",
      context: '{"a":',
      attributes: { v: "2" },
      end: false,
    });
  });

  it("holds back a marker line cut mid-stream", () => {
    const raw = "]]>honestai:content\nroot = A()\n]]>honest";
    expect(parseMessage(raw, { streaming: true }).content).toBe("root = A()");
    expect(parseMessage(raw).content).toBe("root = A()\n]]>honest");
  });

  it("reads a content line that starts mid-line after a cut-off attempt", () => {
    const header = "]]>honestai:content?v=2";
    const raw = `${header}\nroot = A("Broken${header}\nroot = B()\n]]>honestai:end`;
    expect(parseMessage(raw)).toMatchObject({
      content: "root = B()",
      attributes: { v: "2" },
      end: true,
    });
  });

  it("holds back a mid-line content line cut mid-stream", () => {
    const raw = ']]>honestai:content\nroot = A("Broken]]>honestai:content?v=2\nroot = B()';
    const header = raw.indexOf("]]>", 3);
    // Chunks end inside the content line: `]]>`, `]]>honestai:cont`, then the whole line.
    for (const end of [header + 3, header + 14, raw.indexOf("\nroot = B")]) {
      expect(parseMessage(raw.slice(0, end), { streaming: true }).content).toBe('root = A("Broken');
    }
    expect(parseMessage(raw, { streaming: true })).toMatchObject({
      content: "root = B()",
      attributes: { v: "2" },
    });
  });

  it("ignores an end line before the winning content", () => {
    const raw = `]]>honestai:context\n{"$x":1}\n]]>honestai:end\n]]>honestai:content\nroot = A()`;
    expect(parseMessage(raw)).toMatchObject({ content: "root = A()", context: null, end: false });
  });
});
