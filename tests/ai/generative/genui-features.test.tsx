// @vitest-environment jsdom
import * as React from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { Renderer, honestChatLibrary } from "@/registry/honest-ai/generative";
import { EventType, GenerativeChat, agUIAdapter, type ChatLLM } from "@/registry/honest-ai/generative/chat";
import { fileName, toCsv } from "@/registry/honest-ai/generative/renderers/block-actions";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => {
  document.body.innerHTML = "";
});

function staticMarkup(program: string) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<Renderer library={honestChatLibrary} response={program} />);
  return container;
}

async function mount(program: string) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => root.render(<Renderer library={honestChatLibrary} response={program} />));
  return container;
}

/** A chat whose one reply is `reply`, sent after a first message; later sends fail when `failAfter` is set. */
async function chat(reply: string, failAfter: boolean | "once" | "empty-once" = false) {
  let sends = 0;
  const llm: ChatLLM = {
    streamProtocol: agUIAdapter(),
    send: async () => {
      sends += 1;
      if (failAfter === "empty-once" && sends === 2)
        return new Response(
          [
            { type: EventType.TEXT_MESSAGE_START, messageId: "e", role: "assistant" },
            { type: EventType.TEXT_MESSAGE_END, messageId: "e" },
          ]
            .map((event) => `data: ${JSON.stringify(event)}\n\n`)
            .join(""),
          { headers: { "Content-Type": "text/event-stream" } },
        );
      if (failAfter === "once" ? sends === 2 : failAfter === true && sends > 1) throw new Error("The connection dropped");
      return new Response(
        [
          { type: EventType.TEXT_MESSAGE_START, messageId: "r", role: "assistant" },
          { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "r", delta: reply },
          { type: EventType.TEXT_MESSAGE_END, messageId: "r" },
        ]
          .map((event) => `data: ${JSON.stringify(event)}\n\n`)
          .join(""),
        { headers: { "Content-Type": "text/event-stream" } },
      );
    },
  };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => root.render(<GenerativeChat llm={llm} />));
  const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, "Hi");
    prompt.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await React.act(async () => {
    prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  return container;
}

const click = (element: Element) => React.act(async () => (element as HTMLElement).click());
/** Types `text` in the chat's prompt and sends it. */
async function send(container: Element, text: string) {
  const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, text);
    prompt.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await React.act(async () => {
    prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await React.act(async () => new Promise<void>((resolve) => setTimeout(resolve, 20)));
}
const users = (container: Element) =>
  [...container.querySelectorAll('[data-role="user"]')].map((message) => message.textContent ?? "");
const columnText = (container: Element, index: number) =>
  [...container.querySelectorAll("tbody tr")].map((row) => row.children[index]?.textContent);

describe("block toolbar", () => {
  it("writes CSV that survives commas, quotes and line breaks", () => {
    expect(toCsv([["Name", "Note"], ["Ada", 'Said "hi", then left'], ["Bo", "two\nlines"]])).toBe(
      'Name,Note\nAda,"Said ""hi"", then left"\nBo,"two\nlines"',
    );
    // Formula-like text is neutralised; plain negative numbers stay numbers.
    expect(toCsv([["=HYPERLINK(\"x\")", "+1", "@sum", "-0.2", "-1,200.5", "-cmd"]])).toBe(
      `"'=HYPERLINK(""x"")",+1,'@sum,-0.2,"-1,200.5",'-cmd`,
    );
    expect(toCsv([["\n=1", "＝1", "－cmd"]])).toBe(`"'\n=1",'＝1,'－cmd`);
    // Plain signed values are data and stay as written.
    expect(toCsv([["-3.2%", "-$1,200", "+5%", "-1e3"]])).toBe(`-3.2%,"-$1,200",+5%,-1e3`);
    expect(fileName("Amount ($) by category", "csv")).toBe("amount-by-category.csv");
    expect(fileName("", "png")).toBe("data.png");
  });

  it("names each chart and table control for the block it acts on", () => {
    const container = staticMarkup(
      [
        "root = Stack([c, t])",
        'c = BarChart(["Jan", "Feb"], [Series("Orders", [12, 18])])',
        't = Table([Col("Month", ["Jan", "Feb"]), Col("Orders", [12, 18])])',
      ].join("\n"),
    );
    const names = [...container.querySelectorAll('[data-slot="block-actions"] button')].map((button) =>
      button.getAttribute("aria-label"),
    );
    expect(names).toEqual([
      "Expand Orders",
      "Copy Orders as CSV",
      "Download Orders as CSV",
      "Download Orders as an image",
      "Expand Month, Orders",
      "Copy Month, Orders as CSV",
      "Download Month, Orders as CSV",
    ]);
  });
});

describe("generated cells", () => {
  it("copies a tag in a cell as the words it shows, not a blank", async () => {
    let copied = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value: string) => void (copied = value) },
    });
    const container = await mount(
      [
        "root = Stack([t])",
        't = Table([Col("Task", ["Ship", "Test"]), Col("Status", [done, late])])',
        'done = Tag("Done", null, "sm", "success")',
        'late = Tag("Late", null, "sm", "danger")',
      ].join("\n"),
    );
    await click(container.querySelector('[aria-label="Copy Task, Status as CSV"]')!);
    expect(copied).toBe("Task,Status\nShip,Done\nTest,Late");
    // Sorting reads the words a tag shows too.
    const status = [...container.querySelectorAll("thead button")][1] as HTMLButtonElement;
    await click(status);
    await click(status);
    expect(columnText(container, 0)).toEqual(["Test", "Ship"]);
  });
});

describe("sortable, filterable tables", () => {
  const table = [
    "root = Stack([t])",
    't = Table([Col("City", ["Oslo", "Lima", "Cairo"]), Col("Population", [709000, 10883000, 10230000])])',
  ].join("\n");

  it("sorts by a column, ascending then descending then back", async () => {
    const container = await mount(table);
    const population = [...container.querySelectorAll("thead button")][1] as HTMLButtonElement;
    expect(population.closest("th")!.getAttribute("aria-sort")).toBe("none");
    await click(population);
    expect(columnText(container, 0)).toEqual(["Oslo", "Cairo", "Lima"]);
    expect(population.closest("th")!.getAttribute("aria-sort")).toBe("ascending");
    await click(population);
    expect(columnText(container, 0)).toEqual(["Lima", "Cairo", "Oslo"]);
    await click(population);
    expect(columnText(container, 0)).toEqual(["Oslo", "Lima", "Cairo"]);
    expect(population.closest("th")!.getAttribute("aria-sort")).toBe("none");
  });

  it("names chosen rows by a text column, not a rank", async () => {
    const program = [
      "root = Stack([t])",
      't = Table([Col("Rank", [1, 2]), Col("Player", ["Ada", "Grace"]), Col("Score", [98, 95])], "Leaderboard")',
    ].join("\n");
    const container = await chat(["```honestai", program, "```"].join("\n"));
    await click(container.querySelector('button[aria-label="Ask about rows of Leaderboard"]')!);
    await click(container.querySelector('[aria-label="Select all rows"]')!);
    await click([...container.querySelectorAll("button")].find((button) => button.textContent?.startsWith("Ask about 2 rows"))!);
    expect(container.textContent).toContain("2 rows from Leaderboard: Ada, Grace");
  });

  it("always says how many rows a table has, and when it has none", async () => {
    const cities = Array.from({ length: 10 }, (_, i) => `"City ${i}"`).join(", ");
    const titled = await mount(`root = Stack([t])\nt = Table([Col("City", [${cities}])], "Cities")`);
    expect(titled.querySelector('[data-slot="records-table-toolbar"]')?.textContent).toContain("Cities10 rows");
    document.body.innerHTML = "";
    const untitled = await mount(`root = Stack([t])\nt = Table([Col("City", [${cities}])])`);
    expect((untitled.querySelector('input[type="search"]') as HTMLInputElement).placeholder).toBe("Filter 10 rows");
    document.body.innerHTML = "";
    const empty = await mount('root = Stack([t])\nt = Table([Col("City", [])])');
    expect(empty.querySelector('[data-slot="records-table-toolbar"]')?.textContent).toBe("No rows");
  });

  it("sorts figures written with separators by their value", async () => {
    const container = await mount(
      'root = Stack([t])\nt = Table([Col("Item", ["A", "B", "C"]), Col("Cost", ["1,000", "900", "$12,500"], "number")])',
    );
    await click([...container.querySelectorAll("thead button")][1]);
    expect(columnText(container, 0)).toEqual(["B", "A", "C"]);
    // Unmarked, they are still read as figures.
    document.body.innerHTML = "";
    const unmarked = await mount(
      'root = Stack([t])\nt = Table([Col("Item", ["A", "B"]), Col("Cost", ["1,000", "$900"])])',
    );
    await click([...unmarked.querySelectorAll("thead button")][1]);
    expect(columnText(unmarked, 0)).toEqual(["B", "A"]);
    expect(unmarked.querySelector("thead th:last-child")!.className).toContain("text-end");
  });

  it("sorts a value that isn't a figure after the figures, and finds a minus typed as a hyphen", async () => {
    const cities = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const costs = ['"$999"', '"N/A"', '"$12,500"', '"-1200"', '"$1,200"', '"5"', '"6"', '"7"', '"8"'];
    const container = await mount(
      `root = Stack([t])\nt = Table([Col("Item", [${cities.map((c) => `"${c}"`).join(", ")}]), Col("Cost", [${costs.join(", ")}], "number")])`,
    );
    await click([...container.querySelectorAll("thead button")][1]);
    expect(columnText(container, 0)).toEqual(["D", "F", "G", "H", "I", "A", "E", "C", "B"]);
    const filter = container.querySelector('input[type="search"]') as HTMLInputElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(filter, "-1,200");
      filter.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(columnText(container, 0)).toEqual(["D"]);
  });

  it("reads only real thousands grouping, and keeps a placeholder after the figures in either direction", async () => {
    const container = await mount(
      'root = Stack([t])\nt = Table([Col("Item", ["A", "B", "C", "D"]), Col("Cost", ["$1,000", "N/A", "$900", "-"])])',
    );
    const cost = [...container.querySelectorAll("thead button")][1];
    await click(cost);
    expect(columnText(container, 0).slice(0, 2)).toEqual(["C", "A"]);
    expect(columnText(container, 0).slice(2).sort()).toEqual(["B", "D"]);
    await click(cost);
    expect(columnText(container, 0).slice(0, 2)).toEqual(["A", "C"]);
    expect(columnText(container, 0).slice(2).sort()).toEqual(["B", "D"]);
    // A placeholder hyphen is not a minus sign.
    expect(columnText(container, 1)).toContain("-");
    document.body.innerHTML = "";
    const malformed = await mount('root = Stack([t])\nt = Table([Col("Item", ["A", "B"]), Col("Code", ["1,2", "10"])])');
    await click([...malformed.querySelectorAll("thead button")][1]);
    // "1,2" is not a figure, so the real one, 10, comes first.
    expect(columnText(malformed, 0)).toEqual(["B", "A"]);
  });

  it("puts figures before other values in a mixed column, in a consistent order", async () => {
    const container = await mount(
      'root = Stack([t])\nt = Table([Col("Plan", ["A", "B", "C"]), Col("Price", ["$1,000", "$12/mo", "$900"])])',
    );
    await click([...container.querySelectorAll("thead button")][1]);
    expect(columnText(container, 0)).toEqual(["C", "A", "B"]);
  });

  it("reads a leading plus or a true minus as a sign", async () => {
    const container = await mount(
      'root = Stack([t])\nt = Table([Col("Team", ["A", "B", "C"]), Col("Change", ["+12%", "\u22123%", "+5%"])])',
    );
    expect(container.querySelector("thead th:last-child")!.className).toContain("text-end");
    const change = [...container.querySelectorAll("thead button")][1];
    await click(change);
    await click(change);
    expect(columnText(container, 0)).toEqual(["A", "C", "B"]);
  });

  it("shows a negative figure with a true minus sign, and copies it with a hyphen", async () => {
    let copied = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value: string) => void (copied = value) },
    });
    const container = await mount('root = Stack([t])\nt = Table([Col("City", ["Oslo"]), Col("Growth", [-0.2])])');
    expect(columnText(container, 1)).toEqual(["\u22120.2"]);
    await click(container.querySelector('[aria-label="Copy City, Growth as CSV"]')!);
    expect(copied).toBe("City,Growth\nOslo,-0.2");
  });

  it("offers a filter only once a table is long, and says how many rows match", async () => {
    expect((await mount(table)).querySelector('input[type="search"]')).toBeNull();
    document.body.innerHTML = "";
    const cities = Array.from({ length: 10 }, (_, i) => `"City ${i}"`).join(", ");
    const container = await mount(`root = Stack([t])\nt = Table([Col("City", [${cities}])])`);
    const filter = container.querySelector('input[type="search"]') as HTMLInputElement;
    expect(filter).not.toBeNull();
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(filter, "City 3");
      filter.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(columnText(container, 0)).toEqual(["City 3"]);
    expect(container.textContent).toContain("1 of 10 rows");
  });
});

describe("asking about table rows", () => {
  it("selects every row shown at once, and clears a filter that matches nothing", async () => {
    const cities = Array.from({ length: 10 }, (_, i) => `"City ${i}"`).join(", ");
    const container = await mount(`root = Stack([t])\nt = Table([Col("City", [${cities}])])`);
    const filter = container.querySelector('input[type="search"]') as HTMLInputElement;
    const type = (value: string) =>
      React.act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(filter, value);
        filter.dispatchEvent(new Event("input", { bubbles: true }));
      });
    await type("City 1");
    await click(container.querySelector('button[aria-label="Ask about rows of City"]')!);
    await click(container.querySelector('[aria-label="Select all rows shown"]')!);
    const ask = [...container.querySelectorAll("button")].find((button) => button.textContent?.startsWith("Ask about"))!;
    expect(ask.textContent).toBe("Ask about 1 row");
    await type("nowhere");
    expect(container.textContent).toContain("No rows match “nowhere”.");
    const clear = [...container.querySelectorAll("button")].find((button) => button.textContent === "Clear filter")!;
    await click(clear);
    expect(filter.value).toBe("");
    expect(columnText(container, 1)).toHaveLength(10);
  });

  it("attaches the chosen rows to the next message, for the reader's own question", async () => {
    const program = [
      "root = Stack([t])",
      't = Table([Col("City", ["Oslo", "Lima", "Cairo"]), Col("Population", [709000, 10883000, 10230000])])',
    ].join("\n");
    const container = await chat(["```honestai", program, "```"].join("\n"));
    // Sorted by population, Cairo comes before Lima, and the rows keep that order.
    await click([...container.querySelectorAll("thead button")][1]);
    await click(container.querySelector('button[aria-label="Ask about rows of City, Population"]')!);
    await click(container.querySelector('[aria-label="Select Lima"]')!);
    await click(container.querySelector('[aria-label="Select Cairo"]')!);
    await click([...container.querySelectorAll("button")].find((button) => button.textContent === "Ask about 2 rows")!);
    // Nothing is sent yet: the rows wait by the composer, which has the caret.
    expect(users(container)).toHaveLength(1);
    expect(container.textContent).toContain("2 rows from the table");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Prompt");
    expect(container.querySelector('[aria-label="Select Lima"]')).toBeNull();
    await send(container, "Which is growing faster?");
    const last = users(container).at(-1)!;
    expect(last).toContain("Which is growing faster?");
    expect(last).toContain("From the table");
    expect(last.indexOf("Cairo")).toBeLessThan(last.indexOf("Lima"));
    expect(last).not.toContain("Oslo");
    // The bubble shows the rows as a table, not as raw pipes.
    expect(container.querySelectorAll('[data-role="user"]')[1].querySelector("table")).not.toBeNull();
    expect(container.querySelector('[aria-label="Attached to your next message"]')).toBeNull();
  });

  it("attaches a saved artifact edit to a question about rows", async () => {
    const program = [
      "root = Stack([plan, t])",
      'plan = Artifact("Notes", [md])',
      'md = MarkDownRenderer("Original notes")',
      't = Table([Col("City", ["Oslo", "Lima"]), Col("Population", [709000, 10883000])])',
    ].join("\n");
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Edit Notes"]')!);
    const editor = target.querySelector("textarea") as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, "ROWS EDIT");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    await click(container.querySelector('button[aria-label="Ask about rows of City, Population"]')!);
    await click(container.querySelector('[aria-label="Select Oslo"]')!);
    await click([...container.querySelectorAll("button")].find((button) => button.textContent?.startsWith("Ask about 1 row"))!);
    await send(container, "What about this one?");
    const last = users(container).at(-1)!;
    expect(last).toContain("Oslo");
    expect(last).toContain("Edited: Notes");
    expect(last).toContain("ROWS EDIT");
    // Delivered, so it no longer waits by the composer.
    expect(container.querySelector('[aria-label="Attached to your next message"]')).toBeNull();
  });

  it("names the rows by the table's title, and says aloud what was attached", async () => {
    const program = [
      "root = Stack([t])",
      't = Table([Col("City", ["Oslo", "Lima"]), Col("Population", [709000, 10883000])], "Capital cities")',
    ].join("\n");
    const container = await chat(["```honestai", program, "```"].join("\n"));
    expect(container.querySelector('[data-slot="records-table-toolbar"]')?.textContent).toContain("Capital cities");
    await click(container.querySelector('button[aria-label="Ask about rows of Capital cities"]')!);
    await click(container.querySelector('[aria-label="Select Lima"]')!);
    await click([...container.querySelectorAll("button")].find((button) => button.textContent?.startsWith("Ask about 1 row"))!);
    expect(container.textContent).toContain("1 row from Capital cities: Lima");
    await React.act(async () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    const statuses = [...container.querySelectorAll('[role="status"]')].map((status) => status.textContent);
    expect(statuses).toContain("Attached to your next message: 1 row from Capital cities: Lima");
    await send(container, "Why so large?");
    expect(users(container).at(-1)).toContain("10,883,000");
  });

  it("keeps the chosen rows attached and leaves no stray turn when the question fails", async () => {
    const program = [
      "root = Stack([t])",
      't = Table([Col("City", ["Oslo", "Lima"]), Col("Population", [709000, 10883000])])',
    ].join("\n");
    const container = await chat(["```honestai", program, "```"].join("\n"), "once");
    await click(container.querySelector('button[aria-label="Ask about rows of City, Population"]')!);
    await click(container.querySelector('[aria-label="Select Lima"]')!);
    await click([...container.querySelectorAll("button")].find((button) => button.textContent?.startsWith("Ask about 1 row"))!);
    await send(container, "Tell me about it");
    await React.act(async () => new Promise<void>((resolve) => setTimeout(resolve, 50)));
    expect(users(container).join(" ")).not.toContain("From the table");
    // Still attached, ready to go with the next try.
    expect(container.textContent).toContain("1 row from the table");
    await send(container, "Tell me about it");
    await React.act(async () => new Promise<void>((resolve) => setTimeout(resolve, 50)));
    expect(users(container).filter((text) => text.includes("From the table"))).toHaveLength(1);
  });

  it("sends a chosen row even after a filter hides it", async () => {
    const cities = Array.from({ length: 10 }, (_, i) => `"City ${i}"`).join(", ");
    const container = await chat(["```honestai", `root = Stack([t])\nt = Table([Col("City", [${cities}])])`, "```"].join("\n"));
    await click(container.querySelector('button[aria-label="Ask about rows of City"]')!);
    await click(container.querySelector('[aria-label="Select City 1"]')!);
    const filter = container.querySelector('input[type="search"]') as HTMLInputElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(filter, "City 7");
      filter.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const ask = [...container.querySelectorAll("button")].find((button) => button.textContent?.startsWith("Ask about 1 row"))!;
    expect(ask.textContent).toBe("Ask about 1 row (1 hidden by filter)");
    await click(ask);
    await send(container, "And this one?");
    expect(users(container).at(-1)).toContain("City 1");
  });
});

describe("artifacts", () => {
  const program = [
    "root = Stack([plan])",
    'plan = Artifact("Onboarding plan", [doc], "Markdown · 4 weeks")',
    'doc = MarkDownRenderer("## Week 1\\nMeet the team")',
  ].join("\n");

  it("renders in place outside a chat, where there is no panel to open", () => {
    const container = staticMarkup(program);
    expect(container.querySelector('section[aria-label="Onboarding plan"]')).not.toBeNull();
    expect(container.textContent).toContain("Meet the team");
  });

  it("shows a card in the reply that opens and closes the panel beside the chat", async () => {
    const container = await chat(["Here is the plan.", "", "```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    expect(card.textContent).toContain("Onboarding plan");
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    // A reply restored or finished before mount opens only when asked.
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    expect(card.getAttribute("aria-expanded")).toBe("true");
    expect(target.textContent).toContain("Meet the team");
    const panel = target.querySelector('[data-slot="generated-artifact-panel"]')!;
    await click(target.querySelector('button[aria-label="Close"]')!);
    // Closed, it stays mounted but hidden, so its state survives.
    expect(panel.hasAttribute("hidden")).toBe(true);
    expect(card.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps what the reader typed when the panel closes and reopens", async () => {
    const form = [
      "root = Stack([a])",
      'a = Artifact("Notes", [f])',
      'f = Form("notes", Buttons([Button("Send", @ToAssistant("Here"), "primary")]), [c])',
      'c = FormControl("Note", Input("note", "", "text"))',
    ].join("\n");
    const container = await chat(["```honestai", form, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const input = container.querySelector('[data-slot="artifact-target"] input') as HTMLInputElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "Remember me");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click(card);
    await click(card);
    const reopened = container.querySelector('[data-slot="artifact-target"] input') as HTMLInputElement;
    expect(reopened.value).toBe("Remember me");
  });

  it("steps between versions of an artifact that share a title", async () => {
    const program = [
      "root = Stack([a, b])",
      'a = Artifact("Plan", [m1])',
      'm1 = MarkDownRenderer("First draft")',
      'b = Artifact("Plan", [m2])',
      'm2 = MarkDownRenderer("Second draft")',
    ].join("\n");
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const [first] = [...container.querySelectorAll('[data-slot="artifact-card"]')] as HTMLButtonElement[];
    expect(first.textContent).toContain("Version 1 of 2");
    if (first.getAttribute("aria-expanded") !== "true") await click(first);
    const visible = () =>
      [...container.querySelectorAll('[data-slot="generated-artifact-panel"]:not([hidden])')].map(
        (panel) => panel.textContent,
      );
    expect(visible().join()).toContain("First draft");
    await click(container.querySelector('button[aria-label="Next version of Plan"]:not([disabled])')!);
    expect(visible()).toHaveLength(1);
    expect(visible()[0]).toContain("Second draft");
    // Focus follows to the version now showing, not lost with the hidden one.
    await React.act(async () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    const showing = container.querySelector('[data-slot="generated-artifact-panel"]:not([hidden])');
    expect(document.activeElement).toBe(showing);
    // Each card keeps saying which version it is while its panel is open.
    const cards = [...container.querySelectorAll('[data-slot="artifact-card"]')].map((card) => card.textContent);
    expect(cards[1]).toContain("Version 2 of 2");
  });

  it("keeps a cell's backslash and pipe inside one cell when its row is asked about", async () => {
    const program = ["root = Stack([t])", 't = Table([Col("Path", ["A\\\\|B"]), Col("Size", [3])])'].join("\n");
    const container = await chat(["```honestai", program, "```"].join("\n"));
    await click(container.querySelector('button[aria-label="Ask about rows of Path, Size"]')!);
    await click(container.querySelector('[aria-label^="Select "]')!);
    await click([...container.querySelectorAll("button")].find((button) => button.textContent?.startsWith("Ask about 1 row"))!);
    await send(container, "What is it?");
    const cells = [...container.querySelectorAll('[data-role="user"]')].at(-1)!.querySelectorAll("tbody td");
    expect([...cells].map((cell) => cell.textContent)).toEqual(["A\\|B", "3"]);
  });

  it("says when copying an artifact fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => Promise.reject(new Error("Denied")) },
    });
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Copy Onboarding plan"]')!);
    expect(target.textContent).toContain("Couldn’t copy. Select the text to copy it.");
  });

  it("announces an edit saved again to the same artifact", async () => {
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    const save = async (text: string) => {
      await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
      const editor = target.querySelector("textarea") as HTMLTextAreaElement;
      await React.act(async () => {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, text);
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    };
    const frame = () => React.act(async () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    await save("First");
    await frame();
    const announcer = [...container.querySelectorAll('[role="status"]')].find((status) =>
      status.textContent?.includes("Your edit to Onboarding plan"),
    )!;
    expect(announcer).toBeDefined();
    await save("Second");
    // Cleared, then said again, so a screen reader hears the new save.
    expect(announcer.textContent).toBe("");
    await frame();
    expect(announcer.textContent).toBe("Attached to your next message: Your edit to Onboarding plan");
  });

  it("saves nothing when the edit changed nothing", async () => {
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    expect(target.querySelector("textarea")).toBeNull();
    expect(target.textContent).not.toContain("Edited");
    expect(container.querySelector('[aria-label="Attached to your next message"]')).toBeNull();
  });

  it("lets the reader edit a written artifact, then restore the original", async () => {
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    const editor = target.querySelector("textarea") as HTMLTextAreaElement;
    expect(editor.value).toContain("Meet the team");
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, "## Week 1\nMeet everyone");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // Preview shows the draft as it will read, then hands back the same text.
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Preview")!);
    expect(target.querySelector('[aria-label="Preview of Onboarding plan"] h2')?.textContent).toBe("Week 1");
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Back to editing")!);
    expect((target.querySelector("textarea") as HTMLTextAreaElement).value).toBe("## Week 1\nMeet everyone");
    // Escape in the preview returns to the text, not out of the panel.
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Preview")!);
    await React.act(async () => {
      target
        .querySelector('[aria-label="Preview of Onboarding plan"]')!
        .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });
    expect(target.querySelector('[aria-label="Preview of Onboarding plan"]')).toBeNull();
    expect(target.querySelector("textarea")).not.toBeNull();
    // Escape over unsaved changes asks first; the draft stays.
    const escape = () =>
      React.act(async () => {
        target
          .querySelector("textarea")!
          .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      });
    await escape();
    expect(target.textContent).toContain("Press Escape or Cancel again to discard them.");
    // Escape that ends an input method's composition leaves the draft and the panel alone.
    await React.act(async () => {
      target
        .querySelector("textarea")!
        .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", isComposing: true, bubbles: true, cancelable: true }));
    });
    expect(target.querySelector("textarea")).not.toBeNull();
    expect(target.querySelector('[data-slot="generated-artifact-panel"]:not([hidden])')).not.toBeNull();
    expect((target.querySelector("textarea") as HTMLTextAreaElement).value).toBe("## Week 1\nMeet everyone");
    // Ctrl+Enter saves, and focus returns to Edit.
    await React.act(async () => {
      target
        .querySelector("textarea")!
        .dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true, cancelable: true }));
    });
    await React.act(async () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Edit Onboarding plan");
    expect(target.textContent).toContain("Meet everyone");
    // The edit joins the conversation when the reader sends it now.
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Send now")!);
    const users = [...container.querySelectorAll('[data-role="user"]')].map((message) => message.textContent);
    // The bubble shows the edit compactly; the stored message keeps it in full.
    expect(users.at(-1)).toContain("Edited: Onboarding plan");
    expect(users.at(-1)).toContain("Meet everyone");
    // The open panel's header says the content is the reader's edit.
    expect(target.querySelector("header, [data-slot='artifact-panel-header']")?.textContent ?? target.textContent).toContain("Edited");
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Restore original")!);
    expect(target.textContent).toContain("Meet the team");
  });

  it("sends an unsent edit with the reader's next message", async () => {
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    const editor = target.querySelector("textarea") as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, "## Week 1\nShadow a teammate");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    expect(target.textContent).toContain("Your edit goes with your next message");
    // The composer shows what will be attached.
    const chips = container.querySelector('[aria-label="Attached to your next message"]')!;
    expect(chips.textContent).toContain("Your edit to Onboarding plan");
    const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, "Make week 1 longer");
      prompt.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await React.act(async () => {
      prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    const users = [...container.querySelectorAll('[data-role="user"]')].map((message) => message.textContent);
    expect(users.at(-1)).toContain("Make week 1 longer");
    expect(users.at(-1)).toContain("Shadow a teammate");
    // Sent once: the note is gone.
    expect(target.textContent).not.toContain("Your edit goes with your next message");
  });

  it("keeps an edit attached when the send fails, for the retry", async () => {
    const container = await chat(["```honestai", program, "```"].join("\n"), true);
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    const editor = target.querySelector("textarea") as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, "MY SAVED EDIT");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, "Please revise");
      prompt.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await React.act(async () => {
      prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    // The send failed: the edit is still attached and the composer has the text back.
    expect(container.querySelector('[aria-label="Attached to your next message"]')?.textContent).toContain(
      "Your edit to Onboarding plan",
    );
    expect((container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement).value).toBe("Please revise");
  });

  it("retries a failed send as one turn that carries the edit once", async () => {
    const container = await chat(["```honestai", program, "```"].join("\n"), "once");
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    const editor = target.querySelector("textarea") as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, "RETRY EDIT");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    const submit = async (value: string) => {
      const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
      await React.act(async () => {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, value);
        prompt.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await React.act(async () => {
        prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
    };
    await submit("Please revise");
    // Failed: the turn left the thread; the composer and chip hold it.
    expect([...container.querySelectorAll('[data-role="user"]')].map((m) => m.textContent).join(" ")).not.toContain(
      "Please revise",
    );
    await submit("Please revise");
    const users = [...container.querySelectorAll('[data-role="user"]')].map((m) => m.textContent ?? "");
    expect(users.filter((text) => text.includes("Please revise"))).toHaveLength(1);
    expect(users.filter((text) => text.includes("RETRY EDIT"))).toHaveLength(1);
  });

  it("saves an edit in this browser and marks it once the assistant has it", async () => {
    // This jsdom has no storage of its own; give it a plain in-memory one.
    const items = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (name: string) => items.get(name) ?? null,
        setItem: (name: string, value: string) => void items.set(name, value),
        removeItem: (name: string) => void items.delete(name),
        clear: () => items.clear(),
        key: (index: number) => [...items.keys()][index] ?? null,
        get length() {
          return items.size;
        },
      },
    });
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    const editor = target.querySelector("textarea") as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, "KEPT EDIT");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    const key = [...items.keys()].find((name) => name.startsWith("honest-ai:artifact-edit:"))!;
    expect(key).toBeDefined();
    expect(JSON.parse(window.localStorage.getItem(key)!)).toMatchObject({ text: "KEPT EDIT", sent: false });
    expect(typeof JSON.parse(window.localStorage.getItem(key)!).savedAt).toBe("number");
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Send now")!);
    await React.act(async () => new Promise<void>((resolve) => setTimeout(resolve, 50)));
    expect(JSON.parse(window.localStorage.getItem(key)!)).toMatchObject({ text: "KEPT EDIT", sent: true });
  });

  it("keeps an edit attached when the answer comes back empty", async () => {
    const container = await chat(["```honestai", program, "```"].join("\n"), "empty-once");
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    const editor = target.querySelector("textarea") as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, "EMPTY REPLY EDIT");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, "Revise it");
      prompt.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await React.act(async () => {
      prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    // No reply began: the turn left the thread, the edit is still attached,
    // and the reader is told why.
    expect(container.textContent).toContain("No reply came back");
    expect([...container.querySelectorAll('[data-role="user"]')].map((m) => m.textContent).join(" ")).not.toContain(
      "Revise it",
    );
    expect(container.querySelector('[aria-label="Attached to your next message"]')).not.toBeNull();
  });

  it("clears saved edits per conversation or all at once, and drops expired ones", async () => {
    const items = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (name: string) => items.get(name) ?? null,
        setItem: (name: string, value: string) => void items.set(name, value),
        removeItem: (name: string) => void items.delete(name),
        key: (index: number) => [...items.keys()][index] ?? null,
        get length() {
          return items.size;
        },
      },
    });
    const { clearArtifactEdits, artifactEditKey } = await import("@/registry/honest-ai/generative/renderers/artifact");
    const fresh = JSON.stringify({ text: "x", sent: false, savedAt: Date.now() });
    items.set(artifactEditKey("t1", "A", 1, [])!, fresh);
    items.set(artifactEditKey("t2", "B", 1, [])!, fresh);
    items.set("unrelated", "keep");
    clearArtifactEdits("t1");
    expect([...items.keys()].some((key) => key.includes(":t1:"))).toBe(false);
    expect([...items.keys()].some((key) => key.includes(":t2:"))).toBe(true);
    clearArtifactEdits();
    expect([...items.keys()]).toEqual(["unrelated"]);
  });

  it("keys a saved edit to what the model wrote, not only its title", async () => {
    const { artifactEditKey } = await import("@/registry/honest-ai/generative/renderers/artifact");
    const a = artifactEditKey("t1", "Plan", 1, [{ typeName: "MarkDownRenderer", props: { textMarkdown: "A" } }]);
    const b = artifactEditKey("t1", "Plan", 1, [{ typeName: "MarkDownRenderer", props: { textMarkdown: "B" } }]);
    expect(a).not.toBe(b);
  });

  it("records a removed edit as not sent, and keeps a restoration until delivered", async () => {
    const items = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (name: string) => items.get(name) ?? null,
        setItem: (name: string, value: string) => void items.set(name, value),
        removeItem: (name: string) => void items.delete(name),
        key: (index: number) => [...items.keys()][index] ?? null,
        get length() {
          return items.size;
        },
      },
    });
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    const edit = async (value: string) => {
      await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
      const editor = target.querySelector("textarea") as HTMLTextAreaElement;
      await React.act(async () => {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, value);
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    };
    const stored = () => {
      const key = [...items.keys()].find((name) => name.startsWith("honest-ai:artifact-edit:"));
      return key ? JSON.parse(items.get(key)!) : null;
    };
    // Removed from the next message: not sent, and it won't come back.
    await edit("DISMISSED EDIT");
    await click(container.querySelector('button[aria-label="Don’t send your edit to Onboarding plan"]')!);
    expect(stored()).toMatchObject({ text: "DISMISSED EDIT", sent: false, dismissed: true });

    // Delivered, then restored: the restoration waits for a reply, in storage too.
    await edit("SENT EDIT");
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Send now")!);
    await React.act(async () => new Promise<void>((resolve) => setTimeout(resolve, 50)));
    expect(stored()).toMatchObject({ text: "SENT EDIT", sent: true });
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Restore original")!);
    expect(stored()).toMatchObject({ sent: false, restored: true });
    expect(container.querySelector('[aria-label="Attached to your next message"]')).not.toBeNull();
  });

  it("tells the model about a restore after it saw an earlier edit, even with a later one saved", async () => {
    const items = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (name: string) => items.get(name) ?? null,
        setItem: (name: string, value: string) => void items.set(name, value),
        removeItem: (name: string) => void items.delete(name),
        key: (index: number) => [...items.keys()][index] ?? null,
        get length() {
          return items.size;
        },
      },
    });
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    const edit = async (value: string) => {
      await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
      const editor = target.querySelector("textarea") as HTMLTextAreaElement;
      await React.act(async () => {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, value);
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    };
    await edit("EDIT A");
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Send now")!);
    await React.act(async () => new Promise<void>((resolve) => setTimeout(resolve, 50)));
    await edit("EDIT B");
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Restore original")!);
    expect(target.textContent).toContain("The original goes with your next message.");
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Send now")!);
    await React.act(async () => new Promise<void>((resolve) => setTimeout(resolve, 50)));
    const users = [...container.querySelectorAll('[data-role="user"]')].map((m) => m.textContent ?? "");
    expect(users.at(-1)).toContain("Restored: Onboarding plan");
    expect(users.at(-1)).toContain("Meet the team");
  });

  it("keeps an edit attached when Send now fails, and sends it once after", async () => {
    const container = await chat(["```honestai", program, "```"].join("\n"), "once");
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    const editor = target.querySelector("textarea") as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, "SEND NOW EDIT");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Send now")!);
    await React.act(async () => new Promise<void>((resolve) => setTimeout(resolve, 50)));
    expect(container.querySelector('[aria-label="Attached to your next message"]')?.textContent).toContain(
      "Your edit to Onboarding plan",
    );
    // The banner says it didn't go, rather than the message silently vanishing.
    expect(target.textContent).toContain("Your edit wasn’t sent");
    // The failed edit-only turn left the thread, so the next send carries it once.
    const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, "hi");
      prompt.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await React.act(async () => {
      prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    const users = [...container.querySelectorAll('[data-role="user"]')].map((m) => m.textContent ?? "");
    expect(users.filter((text) => text.includes("SEND NOW EDIT"))).toHaveLength(1);
  });

  it("settles only the edit a send carried, not one saved during it", async () => {
    const { setPending, peekArtifactEdits, settleArtifactEdits } = await import(
      "@/registry/honest-ai/generative/renderers/artifact"
    );
    const store = {};
    setPending(store, "a", { title: "Plan", text: "first" });
    const sent = peekArtifactEdits(store);
    setPending(store, "a", { title: "Plan", text: "second" });
    settleArtifactEdits(store, sent);
    expect(peekArtifactEdits(store).text).toContain("second");
  });

  it("does not send an edit the reader removed from the composer", async () => {
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    const editor = target.querySelector("textarea") as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, "DROP THIS EDIT");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    await click(container.querySelector('button[aria-label="Don’t send your edit to Onboarding plan"]')!);
    expect(container.querySelector('[aria-label="Attached to your next message"]')).toBeNull();
    const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, "Next question");
      prompt.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await React.act(async () => {
      prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    const users = [...container.querySelectorAll('[data-role="user"]')].map((message) => message.textContent);
    expect(users.join(" ")).not.toContain("DROP THIS EDIT");
  });

  it("never sends an unsent edit in another conversation", async () => {
    const container = await chat(["```honestai", program, "```"].join("\n"));
    const card = container.querySelector('[data-slot="artifact-card"]') as HTMLButtonElement;
    if (card.getAttribute("aria-expanded") !== "true") await click(card);
    const target = container.querySelector('[data-slot="artifact-target"]')!;
    await click(target.querySelector('button[aria-label="Edit Onboarding plan"]')!);
    const editor = target.querySelector("textarea") as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(editor, "SECRET THREAD ONE EDIT");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click([...target.querySelectorAll("button")].find((button) => button.textContent === "Save")!);
    await click([...container.querySelectorAll("button")].find((button) => button.textContent === "New conversation")!);
    const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, "Fresh unrelated question");
      prompt.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await React.act(async () => {
      prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    const users = [...container.querySelectorAll('[data-role="user"]')].map((message) => message.textContent);
    expect(users.at(-1)).toContain("Fresh unrelated question");
    expect(users.join(" ")).not.toContain("SECRET THREAD ONE EDIT");
  });

  it("copies and downloads what the artifact was written as", async () => {
    const { artifactSource } = await import("@/registry/honest-ai/generative/renderers/artifact");
    const md = { typeName: "MarkDownRenderer", props: { textMarkdown: "## Week 1" } };
    const code = { typeName: "CodeBlock", props: { language: "python", codeString: "print(1)" } };
    expect(artifactSource([code])).toEqual({
      text: "print(1)",
      extension: "py",
      language: "python",
      complete: true,
    });
    expect(artifactSource([md, code])).toEqual({
      text: "## Week 1\n\n```python\nprint(1)\n```",
      extension: "md",
      complete: true,
    });
    // Prose beside a chart: the text is only part of it, and says so.
    expect(artifactSource([md, { typeName: "BarChart", props: {} }])?.complete).toBe(false);
    expect(artifactSource([{ typeName: "BarChart", props: {} }])).toBeNull();
  });
});

describe("sandboxed HTML visuals", () => {
  const program = [
    "root = Stack([v])",
    'v = HtmlVisual("Handshake", "<p>Hello</p><script>document.title = 1</script>", "Three messages", 200)',
  ].join("\n");

  it("runs only in an opaque-origin frame that blocks the network", async () => {
    const container = await mount(program);
    await React.act(async () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    const frame = container.querySelector("iframe")!;
    expect(frame).not.toBeNull();
    // Scripts only: no same-origin, forms, popups, navigation or downloads.
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    expect(frame.getAttribute("title")).toBe("Handshake");
    const source = frame.getAttribute("srcdoc")!;
    // The outer frame blocks the network and any navigation of the inner one.
    expect(source).toContain(`content="default-src 'none'; script-src 'unsafe-inline'`);
    expect(source).toContain("frame-src 'none'");
    // The model's document is a script string inside it, unable to close the script.
    expect(source).toContain("\\u003cp>Hello\\u003c/p>");
    expect(source).not.toContain("<p>Hello</p>");
  });

  it("ignores a height message from any window but its own frame", async () => {
    const container = await mount(program);
    await React.act(async () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    const frame = container.querySelector("iframe")!;
    const before = frame.style.height;
    await React.act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", { data: { type: "honest-visual:height", height: 900 }, source: window }),
      );
    });
    expect(frame.style.height).toBe(before);
  });

  it("does not run a visual that is still arriving", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(
      <Renderer library={honestChatLibrary} response={program} isStreaming />,
    );
    expect(container.querySelector("iframe")).toBeNull();
  });
});

describe("attached edits in the reader's message", () => {
  it("separates the reader's words from the edits that went with them", async () => {
    const { readEdits } = await import("@/registry/honest-ai/generative/user-message");
    const message = [
      "Make it shorter",
      "",
      "Here is my edited version of “Plan”. Use it for any further changes:",
      "",
      "````markdown",
      "## Week 1",
      "```js",
      "x()",
      "```",
      "````",
    ].join("\n");
    expect(readEdits(message)).toEqual({
      text: "Make it shorter",
      edits: [{ title: "Plan", body: "## Week 1\n```js\nx()\n```" }],
      quotes: [],
      rows: [],
    });
    expect(readEdits("Just a question")).toEqual({ text: "Just a question", edits: [], quotes: [], rows: [] });
    // A passage asked about, with a blank line inside it, before a form payload.
    expect(
      readEdits('Make this friendlier\n\nAbout this part of “Plan”:\n\n> Meet the team\n>\n> Set up accounts\n{"form":{}}'),
    ).toEqual({
      text: 'Make this friendlier\n{"form":{}}',
      edits: [],
      quotes: [{ title: "Plan", passage: "Meet the team\n\nSet up accounts" }],
      rows: [],
    });
    expect(readEdits("Compare them\n\nAbout these 2 rows from “Cities”:\n\n| City |\n| --- |\n| Oslo |\n| Lima |").rows).toEqual([
      { title: "Cities", table: "| City |\n| --- |\n| Oslo |\n| Lima |" },
    ]);
    // A title with quotation marks of its own.
    const quoted = readEdits("Here is my edited version of “Essay: “The Road””. Use it for any further changes:\n\n```markdown\nText\n```");
    expect(quoted.edits).toEqual([{ title: "Essay: “The Road”", body: "Text" }]);
  });
});

describe("one delivery rule", () => {
  it("counts text, a tool call or a tool's result as a reply that began", async () => {
    const { replyBegan } = await import("@/registry/honest-ai/generative/renderers/artifact");
    expect(replyBegan([])).toBe(false);
    expect(replyBegan([{ id: "a", role: "assistant", content: "" } as never])).toBe(false);
    expect(replyBegan([{ id: "a", role: "assistant", content: "Hi" } as never])).toBe(true);
    expect(
      replyBegan([{ id: "a", role: "assistant", content: "", toolCalls: [{ id: "t" }] } as never]),
    ).toBe(true);
    expect(replyBegan([{ id: "t", role: "tool", content: "42", toolCallId: "t" } as never])).toBe(true);
  });

  it("keeps a follow-up's form payload on the last line when edits are added", async () => {
    const { beforePayload } = await import("@/registry/honest-ai/generative/user-message");
    expect(beforePayload('Plan it\n{"form":1}', "\n\nEDIT")).toBe('Plan it\n\nEDIT\n{"form":1}');
    expect(beforePayload("Plain question", "\n\nEDIT")).toBe("Plain question\n\nEDIT");
  });

  it("drops a re-sent message's stale edit to an artifact edited again", async () => {
    const { withoutEdits } = await import("@/registry/honest-ai/generative/user-message");
    const block = (title: string, body: string) =>
      `\n\nHere is my edited version of “${title}”. Use it for any further changes:\n\n\`\`\`markdown\n${body}\n\`\`\``;
    const stored = "Shorten it" + block("Plan", "v1") + block("Notes", "n1");
    const result = withoutEdits(stored, new Set(["Plan"]));
    expect(result).not.toContain("v1");
    expect(result).toContain("n1");
    expect(result.startsWith("Shorten it")).toBe(true);
  });
});

describe("follow-ups with no reply", () => {
  it("say so beside the block, since the composer stays empty", async () => {
    const program = [
      "root = Stack([f])",
      'f = FollowUpBlock([FollowUpItem("Tell me more")])',
    ].join("\n");
    const container = await chat(["```honestai", program, "```"].join("\n"), "empty-once");
    await click([...container.querySelectorAll("button")].find((button) => button.textContent === "Tell me more")!);
    await React.act(async () => new Promise<void>((resolve) => setTimeout(resolve, 20)));
    expect(container.textContent).toContain("No reply came back. Try that again.");
    const users = [...container.querySelectorAll('[data-role="user"]')].map((m) => m.textContent ?? "");
    expect(users.join(" ")).not.toContain("Tell me more");
  });
});
