import { describe, expect, it } from "vitest";
import { honestChatLibrary } from "@/registry/honest-ai/generative";
import { createParser } from "@/registry/honest-ai/generative/runtime/core";
import { gallerySamples, sampleProgram } from "@/components/docs/ai/generative-gallery/samples";

describe("generative gallery samples", () => {
  const parser = createParser(honestChatLibrary.toJSONSchema(), "Stack");
  it.each(Object.keys(gallerySamples))("%s parses with no errors", (id) => {
    const program = sampleProgram(gallerySamples[id].reply);
    expect(program).not.toBe("");
    const result = parser.parse(program);
    expect(result.meta.errors).toEqual([]);
    expect(result.root?.typeName).toBe("Stack");
  });
});
