"use client";

import * as React from "react";
import { ArrowUp } from "honestui/icons";
import { PulsingBorder } from "honestui/shaders";

import { Button } from "@/registry/default/ui/button";

// The glow stays off while the field waits for input and fades in while a
// reply is being generated, so it carries state instead of decoration.
export default function PulsingBorderAiInput() {
  const [prompt, setPrompt] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim() || thinking) return;
    setThinking(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setThinking(false);
      setPrompt("");
    }, 3200);
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-3 py-8">
      <PulsingBorder active={thinking} radius={14} bloom={18} smoke={0.2}>
        <form
          onSubmit={submit}
          className="border-border bg-background flex items-end gap-2 rounded-[14px] border p-2 ps-3"
        >
          <label className="sr-only" htmlFor="pulsing-border-prompt">
            Prompt
          </label>
          <textarea
            id="pulsing-border-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask anything…"
            rows={2}
            readOnly={thinking}
            className="text-foreground placeholder:text-muted-foreground min-h-12 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none"
          />
          <Button
            type="submit"
            size="icon-sm"
            aria-label={thinking ? "Generating" : "Send"}
            disabled={!prompt.trim() || thinking}
          >
            <ArrowUp />
          </Button>
        </form>
      </PulsingBorder>
      <p aria-live="polite" className="text-muted-foreground min-h-4 text-center text-xs">
        {thinking ? "Thinking…" : "Type a prompt and press Enter."}
      </p>
    </div>
  );
}
