"use client";
import * as React from "react";
import { Button } from "@/registry/default/ui/button";
import { Renderer, honestLibrary } from "@/registry/honest-ai/generative";

export const stateProgram = `$quantity = 1
root = Stack([TextContent("Example packing count: " + $quantity), buttons])
buttons = Buttons([Button("Add one", @Set($quantity, $quantity + 1), "primary"), Button("Reset count", @Reset($quantity), "secondary")])`;

export default function GenerativeStateDemo() {
  const [state, setState] = React.useState<Record<string, unknown>>({});
  const [saved, setSaved] = React.useState<Record<string, unknown> | null>(null);
  const [initialState, setInitialState] = React.useState<Record<string, unknown>>({});
  const [version, setVersion] = React.useState(0);
  const [status, setStatus] = React.useState("Nothing saved yet.");
  return (
    <div className="grid min-w-0 gap-4 p-4" data-slot="generative-state-demo">
      <p className="m-0 text-sm text-muted-foreground">Local example. Add to the count, save it, change it, then restore.</p>
      <Renderer key={version} response={stateProgram} library={honestLibrary} initialState={initialState} onStateUpdate={setState} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => { setSaved(structuredClone(state)); setStatus("Snapshot saved in this preview."); }}>Save snapshot</Button>
        <Button variant="secondary" disabled={saved === null} onClick={() => {
          if (saved === null) return;
          setInitialState(structuredClone(saved)); setVersion(value => value + 1); setStatus("Saved snapshot restored.");
        }}>Restore snapshot</Button>
      </div>
      <p role="status" className="m-0 text-sm">{status}</p>
      <pre aria-label="Current renderer state" className="m-0 overflow-x-auto text-xs">{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}
