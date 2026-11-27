"use client";
import * as React from "react";
import { Button } from "@/registry/default/ui/button";
import { Textarea } from "@/registry/default/ui/textarea";
import { Label } from "@/registry/default/ui/label";
import {
  Renderer,
  honestLibrary,
  type HonestAIError,
} from "@/registry/honest-ai/generative";
export const generativeSamples = {
  Layout:
    'root = Stack([heading, card])\nheading = InlineHeader("Trip checklist", "Example content — no model is connected.")\ncard = Card([TextContent("## Before you leave\\n- Check your booking\\n- Pack your charger"), TagBlock(["Travel", "Checklist"])])',
  Form: 'root = Stack([form])\nform = Form("contact", buttons, [emailField])\nemailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }), "Use a valid email address.")\nbuttons = Buttons([Button("Send", @ToAssistant("Send contact form"), "primary")])',
  Chart:
    'root = Stack([title, chart])\ntitle = InlineHeader("Example sales", "Illustrative data.")\nchart = BarChart(["Jan", "Feb", "Mar"], [Series("Orders", [12, 18, 15])], "grouped")',
  Tabs: 'root = Stack([tabs])\ntabs = Tabs([first, second])\nfirst = TabItem("summary", "Summary", [TextContent("A generated interface using Honest UI tabs.")])\nsecond = TabItem("details", "Details", [TextContent("Tab through the controls or use the arrow keys.")])',
};
export default function GenerativeUIDemo() {
  const [source, setSource] = React.useState(generativeSamples.Layout);
  const [response, setResponse] = React.useState(source);
  const [streaming, setStreaming] = React.useState(false);
  const [errors, setErrors] = React.useState<HonestAIError[]>([]);
  const [action, setAction] = React.useState("");
  React.useEffect(() => {
    if (!streaming) return;
    let cursor = 0;
    const timer = window.setInterval(() => {
      cursor += 16;
      setResponse(source.slice(0, cursor));
      if (cursor >= source.length) {
        setStreaming(false);
        window.clearInterval(timer);
      }
    }, 40);
    return () => window.clearInterval(timer);
  }, [streaming, source]);
  return (
    <div
      data-slot="generative-playground"
      className="grid w-full min-w-0 gap-5 p-4"
    >
      <div className="flex flex-wrap gap-2">
        {Object.entries(generativeSamples).map(([name, sample]) => (
          <Button
            key={name}
            variant="secondary"
            disabled={streaming}
            onClick={() => {
              setSource(sample);
              setResponse(sample);
              setAction("");
            }}
          >
            {name}
          </Button>
        ))}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="generative-source">Honest AI Lang source</Label>
        <Textarea
          id="generative-source"
          value={source}
          disabled={streaming}
          rows={7}
          className="font-mono text-xs"
          onChange={(event) => {
            setSource(event.target.value);
            setResponse(event.target.value);
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            setResponse("");
            setStreaming(true);
          }}
          disabled={streaming}
        >
          Replay stream
        </Button>
        {streaming && (
          <Button
            variant="secondary"
            onClick={() => {
              setStreaming(false);
              setResponse(source);
            }}
          >
            Stop replay
          </Button>
        )}
        <p role="status" className="m-0 text-sm text-muted-foreground">
          {streaming
            ? "Replaying example tokens…"
            : "Local preview. No model request is sent."}
        </p>
      </div>
      <div className="min-w-0 rounded-md border p-4">
        <Renderer
          response={response}
          library={honestLibrary}
          isStreaming={streaming}
          onError={setErrors}
          onAction={(event) => setAction(JSON.stringify(event, null, 2))}
        />
      </div>
      {!streaming && errors.length > 0 && (
        <div role="alert" className="text-sm text-destructive">
          {errors.map((error, i) => (
            <p key={i}>{error.message}</p>
          ))}
        </div>
      )}
      {action && (
        <div>
          <p role="status">
            Action received locally. Nothing was submitted to a server.
          </p>
          <pre className="max-w-full overflow-x-auto text-xs">{action}</pre>
        </div>
      )}
    </div>
  );
}
