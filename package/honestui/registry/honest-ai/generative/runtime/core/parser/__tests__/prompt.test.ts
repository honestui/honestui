// HonestAI regression test. MIT; see registry/generative/LICENSE.
import { describe, expect, it } from "vitest";
import { generateSystemPrompt, type ConfigPromptOptions, type LibrarySpec } from "../../index";

const CONFIG_MARKER = "]]>honestai:config\n";

function parseBlock(emitted: string): Record<string, unknown> {
  expect(emitted.startsWith(CONFIG_MARKER)).toBe(true);
  const body = emitted.slice(CONFIG_MARKER.length);
  const firstLine = body.split("\n", 1)[0];
  return JSON.parse(firstLine);
}

const library = {
  root: "Card",
  schema: {
    $defs: {
      Card: {
        properties: {
          children: {
            type: "array",
            items: { anyOf: [{ $ref: "#/$defs/TextContent" }] },
          },
          title: { type: "string" },
        },
        required: ["children"],
        description: "Top-level container.",
      },
      TextContent: {
        properties: { text: { type: "string" } },
        required: ["text"],
      },
    },
  },
  componentGroups: [
    {
      name: "Content",
      components: ["TextContent"],
    },
  ],
} as unknown as LibrarySpec; // a spec without components, as application stores it

describe("generateSystemPrompt — self-hosted", () => {
  const spec: LibrarySpec = {
    root: "Card",
    components: {
      Card: { signature: "Card(children: Component[])", description: "Root" },
    },
  };

  it("renders a local prompt from a library spec", () => {
    const prompt = generateSystemPrompt({ library: spec });
    expect(prompt).toContain("honestai-lang");
    expect(prompt).toContain("Card(children: Component[])");
    expect(prompt.startsWith(CONFIG_MARKER)).toBe(false);
  });

  it("without tools, names no Query and no library component outside the spec", () => {
    const prompt = generateSystemPrompt({ library: spec, promptOptions: { bindings: true } });
    expect(prompt).toContain("IMPORTANT @Each rule");
    expect(prompt).not.toContain("Query");
    expect(prompt).not.toContain("Col(");
  });
});

describe("standalone config", () => {
  it("requires a local library", () => {
    // @ts-expect-error Applications must supply their own library.
    expect(() => generateSystemPrompt({ config: true })).toThrow("local library is required");
  });
});

describe("generateSystemPrompt({ config: true, library })", () => {
  it("emits the library under chatLibrary, dropping components", () => {
    const specJson = {
      ...library,
      components: {
        Card: { signature: "Card(children: (TextContent)[], title?: string)" },
      },
    };
    const config = parseBlock(generateSystemPrompt({ config: true, library: specJson }));
    expect((config.chatLibrary as Record<string, unknown>).components).toBeUndefined();
    expect(config.chatLibrary).toEqual(library);
    expect(Object.keys(config)).toEqual(["chatLibrary"]);
  });

  it("systemPromptOptions rides as a sibling key", () => {
    const config = parseBlock(
      generateSystemPrompt({
        config: true,
        library,
        promptOptions: { preamble: "You generate UI for Acme." },
      }),
    );
    expect(Object.keys(config)).toEqual(["chatLibrary", "systemPromptOptions"]);
    expect(config.systemPromptOptions).toEqual({ preamble: "You generate UI for Acme." });
  });

  it("strips application-unsupported prompt flags from the wire", () => {
    const config = parseBlock(
      generateSystemPrompt({
        config: true,
        library,
        promptOptions: {
          preamble: "Acme.",
          editMode: true,
          tools: ["search"],
        } as ConfigPromptOptions,
      }),
    );
    expect(config.systemPromptOptions).toEqual({ preamble: "Acme." });
  });

  it("promptOptions without a library throws", () => {
    expect(() =>
      // @ts-expect-error Explicit local library required.
      generateSystemPrompt({
        config: true,
        promptOptions: { preamble: "Nope." },
      }),
    ).toThrowError(/local library is required/);
  });

  it("invalid library throws with every issue", () => {
    const broken: LibrarySpec = {
      root: "Missing",
      components: {},
      schema: {
        $defs: {
          Card: {
            properties: { body: { $ref: "#/$defs/Nope" } },
            required: ["ghost"],
          },
        },
      },
    };
    expect(() => generateSystemPrompt({ config: true, library: broken })).toThrowError(
      /Invalid library/,
    );
    expect(() => generateSystemPrompt({ config: true, library: broken })).toThrowError(
      /Root component "Missing"/,
    );
    expect(() => generateSystemPrompt({ config: true, library: broken })).toThrowError(
      /Unresolvable \$ref "#\/\$defs\/Nope"/,
    );
    expect(() => generateSystemPrompt({ config: true, library: broken })).toThrowError(
      /required property "ghost"/,
    );
  });
});
