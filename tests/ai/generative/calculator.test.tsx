// @vitest-environment jsdom
import * as React from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import {
  EventType,
  GenerativeChat,
  agUIAdapter,
  type ChatLLM,
} from "@/registry/honest-ai/generative/chat";
import chatSpec from "@/registry/honest-ai/generative/chat-spec.json";
import { Format, Pow, Range } from "@/registry/honest-ai/generative/catalog/functions";
import { formatNumber } from "@/registry/honest-ai/generative/renderers/shared";
(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

function replyWith(text: string): ChatLLM {
  return {
    streamProtocol: agUIAdapter(),
    send: async () =>
      new Response(
        [
          { type: EventType.TEXT_MESSAGE_START, messageId: "r", role: "assistant" },
          { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "r", delta: text },
          { type: EventType.TEXT_MESSAGE_END, messageId: "r" },
        ]
          .map((event) => `data: ${JSON.stringify(event)}\n\n`)
          .join(""),
        { headers: { "Content-Type": "text/event-stream" } },
      ),
  };
}

async function renderProgram(program: string) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => root.render(<GenerativeChat llm={replyWith(program)} />));
  const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, "Hi");
    prompt.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await React.act(async () => {
    prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  const reply = container.querySelectorAll('[data-slot="chat-message"]')[1] as HTMLElement;
  const results = () =>
    Object.fromEntries(
      [...reply.querySelectorAll("dl > div")].map((row) => [
        // The label, without the screen-reader announcement beside it.
        row.querySelector("dt")!.firstChild!.textContent,
        row.querySelector("dd")!.textContent,
      ]),
    );
  const type = async (label: string, value: string) => {
    const input = reply.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };
  return { reply, results, type };
}

// The prompt's own calculator example, so the example the model copies is the one tested.
const example = chatSpec.examples.find((text) => text.includes("Calculator("))!;
const program = example
  .split("```honestai\n")[1]
  .split("\n```")[0]
  // Charts need layout that jsdom does not have; the browser test covers them.
  .replace("root = Stack([savings, growth])", "root = Stack([savings])");

it("computes the prompt example's results and recomputes as inputs change", async () => {
  const { reply, results, type } = await renderProgram(program);
  expect(results()).toEqual({
    "Final balance": "$46,585",
    "You deposit": "$36,000",
    "Growth from returns": "$10,585",
  });
  expect(reply.textContent).toContain("How it's calculated:");
  // No submit step: a Calculator is not a Form.
  expect(reply.querySelector("form")).toBeNull();

  await type("Years", "20");
  expect(results()["Final balance"]).toBe("$123,310");

  // A 0% return takes the guarded branch instead of dividing by zero.
  await type("Annual return (%)", "0");
  expect(results()["You deposit"]).toBe("$72,000");
  expect(results()["Final balance"]).toBe("$72,000");
});

it("builds one row per year from a text input through the runtime", async () => {
  const { reply, type } = await renderProgram(
    [
      "root = Stack([calc, table])",
      '$years = "3"',
      'calc = Calculator([fc], [Result("Years", $years)], "Counts the years.")',
      'fc = FormControl("Years", Input("years", "3", "number", { required: true, min: 1 }, $years))',
      'table = Table([Col("Year", @Each(@Range(1, $years), "y", "Year " + y)), Col("Saved", @Each(@Range(1, $years), "y", @Format(y * 1200, "currency")))])',
    ].join("\n"),
  );
  const cells = () => [...reply.querySelectorAll("td")].map((cell) => cell.textContent);
  expect(cells()).toEqual(["Year 1", "$1,200", "Year 2", "$2,400", "Year 3", "$3,600"]);
  expect(reply.querySelector('[role="alert"]')).toBeNull();
  await type("Years", "1");
  expect(cells()).toEqual(["Year 1", "$1,200"]);
});

it("withholds every result while an input fails its rules", async () => {
  const { reply, results, type } = await renderProgram(program);
  await type("Years", "");
  expect(Object.values(results())).toEqual(["—", "—", "—"]);
  // One note under the main result, not one per result.
  const notes = reply.querySelectorAll('[data-slot="result-incomplete"]');
  expect(notes).toHaveLength(3);
  expect(notes[0].textContent).toBe("Complete the inputs to see this result.");
  expect(reply.querySelector('input[aria-label="Years"]')?.getAttribute("aria-invalid")).toBe("true");
});

it("flags an input that starts incomplete instead of computing from it", async () => {
  const { reply, results } = await renderProgram(
    [
      "root = Stack([split])",
      '$total = "120"',
      '$people = ""',
      'split = Calculator([fcTotal, fcPeople], [each], "Each person pays the total divided by the number of people.")',
      'fcTotal = FormControl("Bill total ($)", Input("total", "120", "number", { required: true }, $total))',
      'fcPeople = FormControl("People", Input("people", "4", "number", { required: true, min: 1 }, $people))',
      'each = Result("Each person pays", $total / $people, "currency")',
    ].join("\n"),
  );
  // Without the rule check this would read "$0", since x / 0 is 0 in the runtime.
  expect(results()).toEqual({ "Each person pays": "—" });
  expect(reply.querySelector('input[aria-label="People"]')?.getAttribute("aria-invalid")).toBe("true");
  expect(reply.querySelector('input[aria-label="Bill total ($)"]')?.getAttribute("aria-invalid")).toBe("false");
});

it("keeps the slider's thumb whether its value is [n] or a bare number", async () => {
  // A program may declare $monthly = 300, and a drag reports a bare number.
  const { reply, results } = await renderProgram(
    [
      "root = Stack([calc])",
      "$monthly = 300",
      'calc = Calculator([fc], [Result("Yearly", $monthly * 12, "currency")], "Yearly = monthly × 12.")',
      'fc = FormControl("Monthly ($)", Slider("monthly", "continuous", 50, 2000, 50, [300], "Monthly", null, $monthly))',
    ].join("\n"),
  );
  const thumb = reply.querySelector<HTMLInputElement>('input[type="range"]')!;
  expect(thumb).not.toBeNull();
  expect(thumb.getAttribute("aria-valuenow")).toBe("300");
  expect(results()).toEqual({ Yearly: "$3,600" });
});

it("names the slider's thumb with its field label", async () => {
  const { reply } = await renderProgram(program);
  const thumb = reply.querySelector<HTMLInputElement>('input[type="range"]');
  expect(thumb?.getAttribute("aria-label")).toBe("Monthly deposit ($)");
});

it("announces a result once it settles, not on every change", async () => {
  const { reply, type } = await renderProgram(program);
  const region = () =>
    [...reply.querySelectorAll('[aria-live="polite"]')].find((node) =>
      node.textContent?.startsWith("You deposit"),
    )!;
  expect(region().textContent).toBe("You deposit: $36,000");
  vi.useFakeTimers();
  await type("Years", "2");
  await type("Years", "20");
  expect(region().textContent).toBe("You deposit: $36,000");
  await React.act(async () => vi.advanceTimersByTime(600));
  expect(region().textContent).toBe("You deposit: $72,000");
});

it("formats numbers for reading and refuses what is not a number", () => {
  expect(formatNumber(411.5, "currency")).toBe("$411.50");
  expect(formatNumber(46584.68, "currency")).toBe("$46,585");
  expect(formatNumber(1234.5, "currency", 2)).toBe("$1,234.50");
  expect(formatNumber(5, "percent")).toBe("5%");
  expect(formatNumber(12.345, "percent")).toBe("12.3%");
  expect(formatNumber(1234567)).toBe("1,234,567");
  expect(formatNumber(10, "currency", undefined, "EUR")).toBe("€10");
  expect(formatNumber(10, "currency", undefined, "not-a-code")).toBe("10");
  expect(formatNumber(Infinity)).toBeUndefined();
  expect(formatNumber("")).toBeUndefined();
  expect(Format.fn({ number: NaN })).toBe("—");
  // Inputs bind strings; an empty one is not zero.
  expect(Format.fn({ number: "" })).toBe("—");
  expect(Format.fn({ number: "1200", format: "currency" })).toBe("$1,200");
  expect(Range.fn({ start: 1, end: "3" })).toEqual([1, 2, 3]);
  expect(Range.fn({ start: 1, end: "" })).toEqual([]);
  expect(Pow.fn({ base: 1.05, exponent: 2 })).toBeCloseTo(1.1025);
  expect(Range.fn({ start: 1, end: 5 })).toEqual([1, 2, 3, 4, 5]);
  expect(Range.fn({ start: 1, end: 50_000 })).toHaveLength(10_000);
  expect(Range.fn({ start: 0, end: 10, step: 5 })).toEqual([0, 5, 10]);
});
