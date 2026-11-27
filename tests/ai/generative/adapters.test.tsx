// @vitest-environment jsdom
import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Renderer,
  honestLibrary,
  honestChatLibrary,
  honestChatPromptOptions,
} from "@/registry/honest-ai/generative";
import {
  createParser,
  generatePrompt,
  generateSystemPrompt,
} from "@/registry/honest-ai/generative/runtime/core";
import spec from "@/registry/honest-ai/generative/spec.json";
import chatSpec from "@/registry/honest-ai/generative/chat-spec.json";
import { generativeSamples } from "@/registry/honest-ai/examples/generative-ui-demo";
import { createDefaultInMemoryStorage } from "@/registry/honest-ai/generative/runtime/headless/adapters/_defaultStorage";
import { safeUrl } from "@/registry/honest-ai/generative/renderers/shared";
describe("Honest component adapters", () => {
  it("keeps server contracts and model prompts in sync with both client libraries", () => {
    for (const [library, saved] of [
      [honestLibrary, spec],
      [honestChatLibrary, chatSpec],
    ] as const) {
      expect(saved.schema).toEqual(library.toJSONSchema());
      expect(generatePrompt(saved)).toContain("TextContent");
    }
  });
  it("gives the chat model a Markdown-first prompt whose example blocks all parse", () => {
    const prompt = honestChatLibrary.prompt(honestChatPromptOptions);
    expect(prompt).toContain("Reply in Markdown");
    expect(prompt).not.toContain("ENTIRE response must be valid");
    // The saved spec alone is enough to build the same prompt on a server.
    expect(generateSystemPrompt({ library: chatSpec })).toBe(prompt);
    const parser = createParser(honestChatLibrary.toJSONSchema(), "Stack");
    const blocks = honestChatPromptOptions
      .examples!.join("\n")
      .matchAll(/^```honestai\n([\s\S]*?)\n```$/gm);
    const programs = [...blocks].map((match) => match[1]);
    expect(programs).toHaveLength(14);
    for (const program of programs) {
      const result = parser.parse(program);
      expect(result.meta.errors).toEqual([]);
      expect(result.root?.typeName).toBe("Stack");
    }
  });
  it("draws the Tag fill, Button fill and text color the program asks for", () => {
    const program = [
      "root = Stack([tags, text, buttons])",
      'tags = Stack([Tag("Paid", null, "md", "success"), Tag("Overdue", null, "md", "danger", "solid"), Tag("Draft", null, "md", "warning", "outline")], "row")',
      'text = TextContent("Up 12%", "default", "success")',
      'buttons = Buttons([Button("Save", null, "primary"), Button("Preview", null, "primary", "normal", "medium", "outline"), Button("Delete", null, "primary", "destructive", "medium", "outline")])',
    ].join("\n");
    expect(
      createParser(honestLibrary.toJSONSchema(), "Stack").parse(program).meta
        .errors,
    ).toEqual([]);
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(
      <Renderer library={honestLibrary} response={program} />,
    );
    const [soft, solid, outline] = [
      ...container.querySelectorAll('[data-slot="badge"]'),
    ].map((badge) => badge.className);
    expect(soft).toContain("background-success-primary");
    expect(solid).toContain("background-danger-emphasis");
    expect(outline).toContain("bg-transparent");
    expect(
      container
        .querySelectorAll('[data-slot="badge"]')[2]
        .getAttribute("style"),
    ).toContain("foreground-attention-primary");
    expect(
      container.querySelector(".honest-prose")?.getAttribute("style"),
    ).toContain("--prose-color:color-mix(in oklab, var(--hui-color-foreground-success-primary)");
    const [save, preview, remove] = [
      ...container.querySelectorAll("button"),
    ].map((button) => button.className);
    expect(save).toContain("background-accent-emphasis");
    expect(preview).toContain("border-[var(--hui-color-border-base-tertiary)]");
    expect(remove).toContain("border-[var(--hui-color-border-danger-emphasis)]");
  });
  it("parses every local playground sample against the real library", () => {
    const parser = createParser(honestLibrary.toJSONSchema(), "Stack");
    for (const sample of Object.values(generativeSamples)) {
      const result = parser.parse(sample);
      expect(result.meta.errors).toEqual([]);
      expect(result.root).not.toBeNull();
    }
  });
  it("exposes every application component to the chat model", () => {
    const application = honestLibrary.toSpec();
    const chat = honestChatLibrary.toSpec();
    expect(Object.keys(application.components).filter((name) => !chat.components[name])).toEqual([]);
  });
  it("accepts switches as form inputs in both libraries", () => {
    const program = `root = Stack([form])
form = Form("preferences", buttons, [field])
field = FormControl("Feedback", SwitchGroup("feedback", [SwitchItem("Explain mistakes", "", "explanations")]))
buttons = Buttons([Button("Save preferences", @ToAssistant("Apply my preferences"))])`;
    for (const library of [honestLibrary, honestChatLibrary]) {
      const result = createParser(library.toJSONSchema(), "Stack").parse(program);
      expect(result.meta.errors).toEqual([]);
      const html = renderToStaticMarkup(<Renderer library={library} response={program} />);
      expect(html).toContain('role="switch"');
      expect(html).toContain("Explain mistakes");
      expect(html).toContain('aria-label="Explain mistakes"');
    }
  });
  it("allows a chat modal to contain chat-specific sections", () => {
    const program = `root = Stack([dialog])
$showDialog = false
dialog = Modal("Details", $showDialog, [sections])
sections = SectionBlock([SectionItem("intro", "Introduction", [TextContent("Details")])], false)`;
    const result = createParser(honestChatLibrary.toJSONSchema(), "Stack").parse(program);
    expect(result.meta.errors).toEqual([]);
    expect(result.root?.typeName).toBe("Stack");
  });
  it("uses Honest components and disables form controls while streaming", () => {
    const html = renderToStaticMarkup(
      <Renderer
        library={honestLibrary}
        response={generativeSamples.Form}
        isStreaming
      />,
    );
    expect(html).toContain('data-slot="input"');
    expect(html).toContain('data-slot="button"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-label="Email"');
    expect(html).not.toContain("honestai-input");
  });
  it("keeps the whole local conversation when revisiting a thread", async () => {
    const storage = createDefaultInMemoryStorage();
    const user = { id: "user1", role: "user" as const, content: "Hello" };
    const thread = await storage.thread.createThread(user);
    storage.rememberMessages(thread.id, [
      user,
      { id: "assistant1", role: "assistant", content: "Response" },
    ]);
    expect(await storage.thread.getMessages(thread.id)).toHaveLength(2);
    await storage.thread.deleteThread(thread.id);
    storage.rememberMessages(thread.id, [user]);
    expect(await storage.thread.getMessages(thread.id)).toEqual([]);
  });
  it("rejects script, data and malformed generated URLs", () => {
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeUrl("data:text/html,<script>")).toBeUndefined();
    expect(safeUrl("not a url")).toBeUndefined();
    expect(safeUrl("https://example.test/path")).toBe(
      "https://example.test/path",
    );
  });
});
