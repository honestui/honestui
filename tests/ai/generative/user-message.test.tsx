// @vitest-environment jsdom
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { UserMessageContent } from "@/registry/honest-ai/generative/chat";

function render(content: string) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<UserMessageContent content={content} />);
  return container;
}

it("presents stored quiz submissions as named answers without JSON wrappers", () => {
  const content = 'Check my answers.\n{"javaQuiz":{"q1":{"value":"extends"},"q2":{"value":"main"}}}';
  const result = render(content);
  expect(result.querySelector('[aria-label="Submitted values"]')).not.toBeNull();
  expect([...result.querySelectorAll("dt")].map((node) => node.textContent)).toEqual(["Q1", "Q2"]);
  expect([...result.querySelectorAll("dd")].map((node) => node.textContent)).toEqual(["extends", "main"]);
  expect(result.textContent).not.toContain("javaQuiz");
  expect(result.textContent).not.toContain('"value"');
});

it("preserves nested values, false, zero, empty strings and multiple form groups", () => {
  const payload = {
    preferences: {
      selectedTopics: { value: ["Java", "React"] },
      settings: { value: { sendEmail: false, count: 0 } },
      note: { value: "" },
      date: { value: null },
    },
    profile: { displayName: { value: "<img src=x onerror=alert(1)>" } },
  };
  const result = render(`Apply preferences\n${JSON.stringify(payload)}`);
  expect(result.textContent).toContain("Preferences");
  expect(result.textContent).toContain("Selected Topics");
  expect(result.querySelectorAll("li")).toHaveLength(2);
  expect(result.textContent).toContain("Send Emailfalse");
  expect(result.textContent).toContain("Count0");
  expect(result.textContent).toContain("Blank");
  expect(result.textContent).toContain("No value");
  expect(result.textContent).toContain("<img src=x onerror=alert(1)>");
  expect(result.querySelector("img")).toBeNull();
});

it("formats standalone component values and reactive action state", () => {
  const result = render('Save changes\n{"roster":{"value":[{"id":"row1","values":["Ada","Engineer"]}],"componentType":"EditableTable"},"$showDetails":false}');
  expect(result.querySelector('[data-slot="submitted-message"]')).not.toBeNull();
  expect(result.textContent).toContain("Roster");
  expect(result.textContent).toContain("Ada");
  expect(result.textContent).toContain("Engineer");
  expect(result.textContent).toContain("Show Detailsfalse");
  expect(result.textContent).not.toContain("componentType");
});

it.each([
  "Explain {a, b, c}",
  'Here is JSON:\n{"name":"Java"}',
  'Broken submission\n{"quiz":',
  'Here is code:\n```json\n{"quiz":{"q1":{"value":"A"}}}\n```',
  'Empty action\n{}',
])("keeps ordinary text, code and unrecognized payloads intact: %s", (content) => {
  const result = render(content);
  expect(result.querySelector('[data-slot="submitted-message"]')).toBeNull();
  expect(result.querySelector(".honest-prose")).not.toBeNull();
});
