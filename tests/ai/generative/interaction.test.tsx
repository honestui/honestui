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
import { Random } from "@/registry/honest-ai/generative/catalog/functions";
(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => {
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
  const llm = replyWith(program);
  const send = vi.spyOn(llm, "send");
  await React.act(async () => root.render(<GenerativeChat llm={llm} />));
  const prompt = container.querySelector('textarea[aria-label="Prompt"]') as HTMLTextAreaElement;
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(prompt, "Hi");
    prompt.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await React.act(async () => {
    prompt.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  const reply = container.querySelectorAll('[data-slot="chat-message"]')[1] as HTMLElement;
  return { reply, send, transcript: container };
}

/** The prompt's own example program, so what the model copies is what is tested. */
function exampleProgram(marker: string) {
  const example = chatSpec.examples.find((text) => text.includes(marker))!;
  return example.split("```honestai\n")[1].split("\n```")[0];
}

const click = (element: Element) =>
  React.act(async () => (element as HTMLElement).click());

/** An option on the question in view, or in the review list, by its visible text. */
function option(scope: Element, label: string) {
  return [...scope.querySelectorAll("label")].find((element) => element.textContent?.startsWith(label))!;
}

function button(reply: HTMLElement, name: string) {
  return [...reply.querySelectorAll("button")].find((element) => element.textContent === name);
}

it("shows one question at a time and reveals nothing before submitting", async () => {
  const { reply } = await renderProgram(exampleProgram("Quiz(["));
  expect(reply.textContent).toContain("Question 1 of 2");
  expect(reply.querySelectorAll('[role="radiogroup"]')).toHaveLength(1);

  // Next asks for an answer rather than skipping the question.
  await click(button(reply, "Next")!);
  expect(reply.textContent).toContain("Choose an answer to continue.");
  expect(reply.textContent).toContain("Question 1 of 2");

  await click(option(reply, "The address of x"));
  expect(reply.textContent).not.toMatch(/Correct|Not quite|Answer/);
  await click(button(reply, "Next")!);
  expect(reply.textContent).toContain("Question 2 of 2");
  // Focus follows the reader to the new question.
  expect(document.activeElement?.tagName).toBe("H2");
  expect(document.activeElement?.textContent).toContain("Which statement changes x through p?");
  expect(button(reply, "Submit answers")).toBeDefined();

  // Answers can change until submitting.
  await click(button(reply, "Back")!);
  await click(option(reply, "10"));
  await click(button(reply, "Next")!);
  await click(option(reply, "p = 20;"));
  await click(option(reply, "*p = 20;"));
  await click(button(reply, "Submit answers")!);
  expect(document.activeElement?.textContent).toBe("2 of 2 correct");
  expect(reply.textContent).toContain("You got every question right.");
  expect(button(reply, "Explain what I missed")).toBeUndefined();
});

it("scores a miss, shows the right answer and explanation, and can explain or start over", async () => {
  const { reply, send, transcript } = await renderProgram(exampleProgram("Quiz(["));
  await click(option(reply, "The address of x"));
  await click(button(reply, "Next")!);
  await click(option(reply, "*p = 20;"));
  await click(button(reply, "Submit answers")!);

  expect(reply.querySelector("h2")?.textContent).toBe("1 of 2 correct");
  const [first, second] = reply.querySelectorAll("ol > li");
  expect(first.textContent).toContain("Not quite. The answer is 10.");
  expect(first.textContent).toContain("follows the address stored in p");
  // Marked in words, not only in color.
  expect(option(first, "10").textContent).toContain("Answer");
  expect(option(first, "The address of x").textContent).toContain("Your answer");
  expect(second.textContent).toContain("Correct.");

  await click(button(reply, "Explain what I missed")!);
  const sent = send.mock.calls.at(-1)![0].messages.at(-1)!;
  expect(sent.content).toContain("Explain the quiz questions I missed");
  expect(sent.content).toContain('"chosen":"The address of `x`"');
  expect(sent.content).toContain('"answer":"`10`"');
  const shown = [...transcript.querySelectorAll('[data-role="user"]')].at(-1)!;
  expect([...shown.querySelectorAll("dt")].map((term) => term.textContent)).toEqual(
    expect.arrayContaining(["Details", "Question", "Chosen", "Answer"]),
  );

  await click(button(reply, "Try again")!);
  expect(reply.textContent).toContain("Question 1 of 2");
  expect(reply.querySelector('[role="radio"][aria-checked="true"]')).toBeNull();
});

it("does not score a question whose answer is not one of its options", async () => {
  const { reply } = await renderProgram(
    [
      "root = Stack([quiz])",
      "quiz = Quiz([q1, q2])",
      'q1 = QuizQuestion("2 + 2?", ["3", "4"], "4")',
      'q2 = QuizQuestion("Capital of Australia?", ["Sydney", "Melbourne"], "Canberra")',
    ].join("\n"),
  );
  await click(option(reply, "4"));
  await click(button(reply, "Next")!);
  await click(option(reply, "Sydney"));
  await click(button(reply, "Submit answers")!);
  expect(reply.textContent).toContain("This question has no answer key, so it isn't scored.");
  // Nothing is marked wrong against an answer that is not there.
  expect(option(reply.querySelectorAll("ol > li")[1], "Sydney").textContent).not.toContain("Your answer");
  expect(reply.querySelector("h2")?.textContent).toBe("1 of 1 correct");
});

it("draws the same number for the same seed, a new one for a new seed, and stays in range", () => {
  expect(Random.fn({ seed: [1, 7, "car"], min: 1, max: 3 })).toBe(
    Random.fn({ seed: [1, 7, "car"], min: 1, max: 3 }),
  );
  const draws = Array.from({ length: 6000 }, (_, i) => Random.fn({ seed: [i, "die"], min: 1, max: 6 }));
  expect(new Set(draws)).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  // Each face lands near a sixth of the time.
  for (let face = 1; face <= 6; face++) {
    const share = draws.filter((value) => value === face).length / draws.length;
    expect(share).toBeGreaterThan(0.14);
    expect(share).toBeLessThan(0.19);
  }
  const fraction = Random.fn({ seed: "x" });
  expect(fraction).toBeGreaterThanOrEqual(0);
  expect(fraction).toBeLessThan(1);
  // Reversed bounds still draw between them.
  expect(Random.fn({ seed: 3, min: 6, max: 1 })).toBeGreaterThanOrEqual(1);
});

it("runs the prompt's simulation example near the theory and draws anew on each run", async () => {
  const program = exampleProgram("Play another run")
    // Charts need layout that jsdom does not have; the browser test covers them.
    .replace("root = Stack([montyHall, outcomes])", "root = Stack([montyHall])");
  const { reply, send } = await renderProgram(program);
  const rates = () =>
    [...reply.querySelectorAll("dl dd:first-of-type")].map((dd) => Number.parseFloat(dd.textContent!));
  const [switched, stayed] = rates();
  expect(switched + stayed).toBeCloseTo(100, 5);
  // 1,000 games: switching wins two thirds of the time, give or take a few points.
  expect(switched).toBeGreaterThan(62);
  expect(switched).toBeLessThan(71);

  const rerun = [...reply.querySelectorAll("button")].find(
    (button) => button.textContent === "Play another run",
  )!;
  const before = rates()[0];
  await click(rerun);
  expect(rates()[0]).not.toBe(before);
  // Rerunning happens in the browser; nothing goes to the model.
  expect(send).toHaveBeenCalledTimes(1);
});

// Shapes a local model wrote when asked to "Simulate the Monty Hall problem".
it("runs a simulation that reuses a Result's name in arithmetic and splits its formula across literals", async () => {
  const { reply } = await renderProgram(
    [
      "root = Stack([sim])",
      "$run = 1",
      '$games = "300"',
      "sim = Calculator(",
      "  [fcGames],",
      "  [switchWins, switchRate],",
      '  "Each game hides the car at random. "',
      '  "Switching wins when the first pick was wrong.",',
      "  rerun",
      ")",
      'fcGames = FormControl("Games", Input("games", "300", "number", { required: true, min: 1, max: 10000 }, $games))',
      'switchWins = Result("Switch wins", @Sum(@Each(@Range(1, $games), "g", @Random([$run, g, "car"], 1, 3) == @Random([$run, g, "pick"], 1, 3) ? 0 : 1)), "number")',
      'switchRate = Result("Switch win rate", switchWins / $games * 100, "percent")',
      'rerun = Buttons([Button("Play another run", @Set($run, $run + 1), "secondary")])',
    ].join("\n"),
  );
  const [wins, rate] = [...reply.querySelectorAll("dl dd:first-of-type")].map((dd) => dd.textContent!);
  // The rate is computed from the wins Result, not from 0.
  expect(Number.parseFloat(rate)).toBeCloseTo((Number(wins) / 300) * 100, 0);
  expect(Number.parseFloat(rate)).toBeGreaterThan(55);
  // The split formula stays one argument, so the rerun button is not dropped.
  expect(reply.textContent).toContain("Each game hides the car at random. Switching wins when the first pick was wrong.");
  expect(button(reply, "Play another run")).toBeDefined();
  expect(reply.querySelector('[role="alert"]')).toBeNull();
});

it("says a result can't be calculated, rather than 0, when arithmetic uses a component", async () => {
  const { reply } = await renderProgram(
    [
      "root = Stack([calc])",
      '$total = "120"',
      'calc = Calculator([fc], [each], "Each pays the total split.")',
      'fc = FormControl("Total", Input("total", "120", "number", { required: true }, $total))',
      'label = TextContent("People")',
      'each = Result("Each pays", $total / label, "currency")',
    ].join("\n"),
  );
  expect(reply.querySelector("dl dd")?.textContent).toBe("—");
  expect(reply.textContent).toContain("This can't be calculated from these inputs.");
});

it("rechecks an input whenever its value changes, not only when typed", async () => {
  const { reply } = await renderProgram(
    [
      "root = Stack([calc])",
      '$games = ""',
      'calc = Calculator([fc], [Result("Games", $games)], "Counts games.", fill)',
      'fc = FormControl("Games", Input("games", "300", "number", { required: true, min: 1 }, $games))',
      'fill = Buttons([Button("Use 300 games", @Set($games, "300"), "secondary")])',
    ].join("\n"),
  );
  const input = reply.querySelector<HTMLInputElement>('input[aria-label="Games"]')!;
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(reply.querySelector("dl dd")?.textContent).toBe("—");
  await click(button(reply, "Use 300 games")!);
  expect(input.getAttribute("aria-invalid")).toBe("false");
  expect(reply.querySelector("dl dd")?.textContent).toBe("300");
});

it("runs the prompt's dice example: the counts add up to the rolls and change on each run", async () => {
  const program = exampleProgram("Roll again").replace(
    "root = Stack([dice, distribution])",
    // Charts need layout jsdom lacks; a table shows the same counts.
    "root = Stack([dice, countsTable])\ncountsTable = Table([Col(\"Total\", totals), Col(\"Rolls\", counts)])",
  );
  const { reply, send } = await renderProgram(program);
  const counts = () =>
    [...reply.querySelectorAll("td")].filter((_, i) => i % 2 === 1).map((cell) => Number(cell.textContent));
  const first = counts();
  expect(first).toHaveLength(11);
  expect(first.reduce((sum, count) => sum + count, 0)).toBe(500);
  // 7 is the most common total.
  expect(first[5]).toBe(Math.max(...first));
  await click(button(reply, "Roll again")!);
  expect(counts()).not.toEqual(first);
  expect(counts().reduce((sum, count) => sum + count, 0)).toBe(500);
  expect(send).toHaveBeenCalledTimes(1);
});

it("draws one frame for a Map, Calculator or Quiz, dropping its own inside a Card", async () => {
  const parts = [
    '$x = "1"',
    'calc = Calculator([FormControl("X", Input("x", "1", "number", null, $x))], [Result("X", $x)], "Shows x.")',
    'quiz = Quiz([QuizQuestion("2 + 2?", ["3", "4"], "4")])',
    'trip = Map([MapPlace("Moab", "Moab, Utah, USA")], "points")',
  ];
  const standalone = await renderProgram(["root = Stack([calc, quiz, trip])", ...parts].join("\n"));
  expect(standalone.reply.querySelectorAll("[data-frame]")).toHaveLength(3);
  document.body.innerHTML = "";

  const inCard = await renderProgram(
    ["root = Stack([card])", 'card = Card([CardHeader("Tools"), calc, quiz, trip])', ...parts].join("\n"),
  );
  expect(inCard.reply.querySelectorAll('[data-slot="card"]')).toHaveLength(1);
  expect(inCard.reply.querySelectorAll("[data-frame]")).toHaveLength(0);
  // Still all there, just without a second frame.
  expect(inCard.reply.textContent).toContain("How it's calculated");
  expect(inCard.reply.textContent).toContain("Question 1 of 1");
  expect(inCard.reply.textContent).toContain("Moab");
});

it("takes focus to the first invalid field on a failed submit, even when it is a group", async () => {
  const { reply } = await renderProgram(
    [
      "root = Stack([form])",
      'form = Form("trip", Buttons([Button("Plan my trip", @ToAssistant("Plan it"), "primary")]), [kind, name])',
      'kind = FormControl("Trip type", OptionCards("kind", "single", [OptionCard("city", "City break"), OptionCard("beach", "Beach")], { required: true }))',
      'name = FormControl("Name", Input("name", "", "text", { required: true }))',
    ].join("\n"),
  );
  await click(button(reply, "Plan my trip")!);
  // The group's container is marked invalid; focus lands on its first choice.
  await React.act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
  const group = reply.querySelector('[aria-invalid="true"]')!;
  expect(group).not.toBeNull();
  expect(group.contains(document.activeElement)).toBe(true);
  expect(document.activeElement).not.toBe(button(reply, "Plan my trip"));
});
