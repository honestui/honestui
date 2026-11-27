"use client";
import * as React from "react";
import { Button } from "@/registry/default/ui/button";
import { Label } from "@/registry/default/ui/label";
import { Textarea } from "@/registry/default/ui/textarea";
import { Renderer, honestLibrary, createParser } from "@/registry/honest-ai/generative";

const validSource = 'root = Stack([TextContent("This example program is valid.")])';
const parser = createParser(honestLibrary.toJSONSchema(), honestLibrary.root);
export default function GenerativeDiagnosticsDemo() {
  const id = React.useId();
  const [source, setSource] = React.useState(validSource);
  const result = React.useMemo(() => parser.parse(source), [source]);
  const errors = result.meta.errors.filter(error => error.severity !== "warning");
  const valid = errors.length === 0 && result.meta.unresolved.length === 0 && !result.meta.incomplete && result.root !== null;
  return <div className="grid min-w-0 gap-4 p-4" data-slot="generative-diagnostics-demo">
    <p className="m-0 text-sm text-muted-foreground">Change a component name to see local parser diagnostics. Restoring source makes no model request.</p>
    <div className="grid gap-2">
      <Label htmlFor={id}>Program to validate</Label>
      <Textarea id={id} rows={3} value={source} onChange={event => setSource(event.target.value)} className="font-mono text-xs" />
    </div>
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => setSource('root = Stack([UnknownCard("Example")])')}>Break component name</Button>
      <Button variant="secondary" onClick={() => setSource(validSource)}>Restore valid source</Button>
    </div>
    {valid ? <><p role="status" className="m-0 text-sm">Program passed local validation.</p><Renderer response={source} library={honestLibrary} /></> :
      <div role="alert" className="grid gap-2 text-sm">
        <p className="m-0">The program is invalid. Correct its source before rendering.</p>
        {errors.map((error, index) => <p key={index} className="m-0"><code>{error.code}</code>: {error.message}</p>)}
        {result.meta.unresolved.length > 0 && <p className="m-0">Unresolved references: {result.meta.unresolved.join(", ")}</p>}
        {result.meta.incomplete && <p className="m-0">A statement is incomplete.</p>}
        {result.root === null && <p className="m-0">No valid root was found.</p>}
      </div>}
  </div>;
}
