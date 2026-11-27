"use client";
import {
  GenerativeChat,
  agUIAdapter,
  type ChatLLM,
  EventType,
} from "@/registry/honest-ai/generative/chat";

const q = JSON.stringify;

const plan = [
  "## Week 1: Setup",
  "- Laptop, accounts and access",
  "- Meet the team",
  "",
  "## Week 2: Shadowing",
  "- Pair on two tickets",
  "",
  "## Week 3: First task",
  "- Ship one small change",
  "",
  "## Week 4: Review",
  "- Check-in with your manager",
].join("\n");

// Mean radius (km) and orbital period (Earth days), rounded.
const bodies = [
  ["Mercury", "Planet", 2440, 88],
  ["Venus", "Planet", 6052, 225],
  ["Earth", "Planet", 6371, 365],
  ["Mars", "Planet", 3390, 687],
  ["Jupiter", "Planet", 69911, 4333],
  ["Saturn", "Planet", 58232, 10759],
  ["Uranus", "Planet", 25362, 30687],
  ["Neptune", "Planet", 24622, 60190],
  ["Ceres", "Dwarf planet", 470, 1682],
  ["Pluto", "Dwarf planet", 1188, 90560],
] as const;

const handshake =
  "<div style='display:grid;gap:8px'><svg viewBox='0 0 320 124' width='100%' style='max-width:440px' role='img' aria-label='A client and a server exchange SYN, SYN-ACK and ACK'><text x='24' y='16' fill='var(--muted)'>Client</text><text x='250' y='16' fill='var(--muted)'>Server</text><line x1='40' y1='24' x2='40' y2='120' stroke='var(--border)'/><line x1='270' y1='24' x2='270' y2='120' stroke='var(--border)'/><g id=g0 style='display:none'><line x1='40' y1='48' x2='270' y2='48' stroke='var(--chart-1)' stroke-width='2'/><text x='155' y='42' text-anchor='middle' fill='var(--foreground)'>SYN</text></g><g id=g1 style='display:none'><line x1='270' y1='78' x2='40' y2='78' stroke='var(--chart-2)' stroke-width='2'/><text x='155' y='72' text-anchor='middle' fill='var(--foreground)'>SYN-ACK</text></g><g id=g2 style='display:none'><line x1='40' y1='108' x2='270' y2='108' stroke='var(--chart-1)' stroke-width='2'/><text x='155' y='102' text-anchor='middle' fill='var(--foreground)'>ACK</text></g></svg><button id=n style='justify-self:start;padding:6px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface)'>Next</button></div><script>const steps=[g0,g1,g2];let i=0;n.onclick=()=>{if(i===steps.length){steps.forEach(g=>g.style.display='none');i=0;n.textContent='Next';return}steps[i++].style.display='';if(i===steps.length)n.textContent='Start over'}</script>";

const block = (...lines: string[]) => ["```honestai", ...lines, "```"].join("\n");

const REPLIES: Record<string, string> = {
  artifact: [
    "Here's a four-week onboarding plan. Open it to read, edit, copy or download it, or select a passage and choose **Ask about this**.",
    "",
    block(
      "root = Stack([plan])",
      `plan = Artifact("Onboarding plan", [doc], "Markdown · 4 weeks")`,
      `doc = MarkDownRenderer(${q(plan)})`,
    ),
  ].join("\n"),
  table: [
    "Sort a column, filter the rows, or tick rows and choose **Ask about rows** to attach them to your next message.",
    "",
    block(
      "root = Stack([tbl])",
      `tbl = Table([Col("Body", ${q(bodies.map((b) => b[0]))}), Col("Type", ${q(bodies.map((b) => b[1]))}), Col("Mean radius (km)", ${q(bodies.map((b) => b[2]))}, "number"), Col("Orbit (days)", ${q(bodies.map((b) => b[3]))}, "number")], "Planets and dwarf planets")`,
    ),
  ].join("\n"),
  chart: [
    "Jupiter's radius is about 11 times Earth's. Use the chart's buttons to expand it, copy or download its data, or save it as an image.",
    "",
    block(
      "root = Stack([chart])",
      `chart = BarChart(${q(bodies.slice(0, 8).map((b) => b[0]))}, [Series("Mean radius (km)", ${q(bodies.slice(0, 8).map((b) => b[2]))})], "grouped", "Planet", "Mean radius (km)")`,
    ),
  ].join("\n"),
  visual: [
    "Each step of the handshake is one message. Press **Next** to send it. The visual runs in a sandboxed frame; use **View code** to read its source.",
    "",
    block(
      "root = Stack([handshake])",
      `handshake = HtmlVisual("TCP three-way handshake", ${q(handshake)}, "Press Next to send each message", 200)`,
    ),
  ].join("\n"),
};

const MENU =
  "No model is connected. Send **artifact**, **table**, **chart** or **visual** to see a saved sample reply.";

const llm: ChatLLM = {
  streamProtocol: agUIAdapter(),
  send: async ({ messages, signal }) => {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const last = messages.findLast((message) => message.role === "user");
    const input = typeof last?.content === "string" ? last.content.toLowerCase() : "";
    const key = Object.keys(REPLIES).find((name) => input.includes(name));
    const reply = key ? REPLIES[key] : MENU;
    const id = crypto.randomUUID();
    const events = [
      { type: EventType.TEXT_MESSAGE_START, messageId: id, role: "assistant" },
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: id, delta: reply },
      { type: EventType.TEXT_MESSAGE_END, messageId: id },
    ];
    return new Response(
      events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""),
      { headers: { "Content-Type": "text/event-stream" } },
    );
  },
};

export default function GenerativeReplyDemo() {
  return (
    <div data-slot="generative-reply-demo" className="grid w-full gap-3 p-4">
      <p className="m-0 text-sm text-muted-foreground">
        Send <strong>artifact</strong>, <strong>table</strong>, <strong>chart</strong> or{" "}
        <strong>visual</strong>. Each reply is a fixed sample; no model or server is called. Planet
        figures are rounded.
      </p>
      <div className="h-[40rem]">
        <GenerativeChat llm={llm} label="Generative reply features example" />
      </div>
    </div>
  );
}
