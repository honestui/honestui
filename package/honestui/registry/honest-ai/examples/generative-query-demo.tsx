"use client";
import * as React from "react";
import { Button } from "@/registry/default/ui/button";
import { Renderer, honestLibrary, useRendererQuery } from "@/registry/honest-ai/generative";

export const queryProgram = `sales = Query("example_sales", {}, {labels: [], values: []})
root = Stack([InlineHeader("Example orders", "Local fixture data"), chart])
chart = BarChart(sales.labels, [Series("Orders", sales.values)], "grouped")`;

function QueryFeedback({ recover }: { recover: () => void }) {
  const { isLoading, errors, retry } = useRendererQuery();
  return (
    <>
      {isLoading && <p role="status" className="m-0 text-sm">Loading local example data…</p>}
      {errors.length > 0 && <div role="alert" className="grid gap-2 text-sm">
        <p className="m-0">The example data query failed. The source program has not changed.</p>
        <Button variant="secondary" onClick={() => { recover(); retry(); }}>Retry data query</Button>
      </div>}
      <Renderer.Content />
    </>
  );
}

export default function GenerativeQueryDemo() {
  const fail = React.useRef(false);
  const [version, setVersion] = React.useState(0);
  const tools = React.useMemo(() => ({
    example_sales: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      if (fail.current) throw new Error("Deliberate example query failure");
      return { labels: ["Jan", "Feb", "Mar"], values: [12, 18, 15] };
    },
  }), []);
  return (
    <div className="grid min-w-0 gap-4 p-4" data-slot="generative-query-demo">
      <p className="m-0 text-sm text-muted-foreground">This query reads a local fixture after a short delay. No network or model request is sent.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => { fail.current = false; setVersion(value => value + 1); }}>Load example data</Button>
        <Button variant="secondary" onClick={() => { fail.current = true; setVersion(value => value + 1); }}>Simulate query failure</Button>
      </div>
      <Renderer key={version} response={queryProgram} library={honestLibrary} toolProvider={tools}>
        <QueryFeedback recover={() => { fail.current = false; }} />
      </Renderer>
    </div>
  );
}
