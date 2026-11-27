/**
 * Fixed chat replies for the generative UI gallery. Each is Markdown with
 * one `honestai` block, exactly as a model would write it. `{origin}` is
 * replaced with the page's origin, since generated image URLs must be
 * absolute. Figures are sample data unless a reply says otherwise.
 */
export type GallerySample = { id: string; reply: string };

const block = (program: string) => "```honestai\n" + program.trim() + "\n```";

const IMAGE = "{origin}/examples/crm-client-workspace.png";

const samples: GallerySample[] = [
  {
    id: "text",
    reply: `Text components carry headings, emphasis and status in a reply.

${block(`
root = Stack([header, lead, body, muted, warn, sep, label, md])
header = InlineHeader("Release notes", "Version 2.4 · sample content")
lead = TextContent("Faster sync and a new export", "large-heavy")
body = TextContent("Sync now starts in the background, so opening a project no longer waits for it.")
muted = TextContent("Rolled out to all workspaces on Monday.", "small", "muted")
warn = TextContent("Exports over 1 GB still time out.", "default", "warning")
sep = Separator()
label = Label("Label: a short caption for the block below")
md = MarkDownRenderer("**Markdown** works too: lists, \`code\`, [links](https://example.com) and tables.\\n\\n- One\\n- Two")
`)}`,
  },
  {
    id: "callouts",
    reply: `Callouts flag what the reader must not miss.

${block(`
root = Stack([info, success, warning, error, quiet])
info = Callout("info", "Heads up", "The API key rotates every 90 days.")
success = Callout("success", "Backup complete", "All 1,204 files were copied.")
warning = Callout("warning", "Storage almost full", "You have used 92% of your plan.")
error = Callout("error", "Payment failed", "The card on file was declined. Update it to keep your plan.")
quiet = TextCallout("neutral", "A quieter note", "TextCallout suits asides that don't need an icon.")
`)}`,
  },
  {
    id: "code",
    reply: `Code renders with highlighting and a copy button.

${block(`
root = Stack([code])
code = CodeBlock("typescript", "export function debounce<T extends unknown[]>(fn: (...args: T) => void, ms = 200) {\\n  let timer: ReturnType<typeof setTimeout> | undefined;\\n  return (...args: T) => {\\n    clearTimeout(timer);\\n    timer = setTimeout(() => fn(...args), ms);\\n  };\\n}")
`)}`,
  },
  {
    id: "images",
    reply: `Images come from URLs a tool returned. \`ImageBlock\` shows one image; \`ImageGallery\` holds several, each with a caption.

${block(`
root = Stack([single, gallery])
single = ImageBlock("${IMAGE}", "CRM client workspace")
gallery = ImageGallery([{ src: "${IMAGE}", alt: "CRM workspace", details: "Client workspace" }, { src: "{origin}/logo-wordmark.svg", alt: "Honest AI wordmark", details: "Wordmark" }])
`)}`,
  },
  {
    id: "table",
    reply: `Sort a column, filter the rows, or choose **Ask about rows**. Figures are rounded.

${block(`
root = Stack([tbl, more])
tbl = Table([Col("Body", ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Ceres", "Pluto"]), Col("Type", ["Planet", "Planet", "Planet", "Planet", "Planet", "Planet", "Planet", "Planet", "Dwarf planet", "Dwarf planet"]), Col("Mean radius (km)", [2440, 6052, 6371, 3390, 69911, 58232, 25362, 24622, 470, 1188], "number"), Col("Orbit (days)", [88, 225, 365, 687, 4333, 10759, 30687, 60190, 1682, 90560], "number")], "Planets and dwarf planets")
more = FollowUpBlock([FollowUpItem("Which planets have rings?"), FollowUpItem("Compare Earth and Mars")])
`)}`,
  },
  {
    id: "editable-table",
    reply: `An editable table lets the reader change values and save them through your app.

${block(`
root = Stack([roster])
roster = EditableTable("roster", [colName, colRole, colStart], [row1, row2, row3])
colName = { type: "text", key: "name", header: "Name" }
colRole = { type: "select", key: "role", header: "Role", options: [{ value: "eng", label: "Engineering" }, { value: "design", label: "Design" }] }
colStart = { type: "date-single", key: "start", header: "Start date" }
row1 = { id: "1", values: ["Alex Kim", "eng", "2026-01-15"] }
row2 = { id: "2", values: ["Jamie Lee", "design", "2026-03-02"] }
row3 = { id: "3", values: ["Sam Ortiz", "eng", "2026-06-20"] }
`)}`,
  },
  {
    id: "bar-line",
    reply: `Bar and line charts compare categories and show change over time. Each has **View data**, CSV export and an image download.

${block(`
root = Stack([bars, lines])
bars = BarChart(["Q1", "Q2", "Q3", "Q4"], [Series("Product A", [120, 150, 180, 210]), Series("Product B", [90, 110, 140, 135])], "grouped", "Quarter", "Units sold")
lines = LineChart(["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"], [Series("Daily users (k)", [7.6, 8.0, 8.4, 8.9, 9.3, 9.8])], "natural", "Month", "Users (k)")
`)}`,
  },
  {
    id: "area-horizontal",
    reply: `Area charts show a total building up; horizontal bars suit long category names.

${block(`
root = Stack([area, horizontal])
area = AreaChart(["Mon", "Tue", "Wed", "Thu", "Fri"], [Series("Web", [320, 410, 380, 450, 520]), Series("Mobile", [210, 260, 300, 310, 360])], "natural", "Day", "Visits")
horizontal = HorizontalBarChart(["Customer support", "Product engineering", "Marketing operations"], [Series("Full time", [24, 41, 12]), Series("Contract", [6, 9, 4])], "stacked", "Team", "People")
`)}`,
  },
  {
    id: "radar",
    reply: `A radar chart compares a few options across the same qualities.

${block(`
root = Stack([radar])
radar = RadarChart(["Speed", "Battery", "Camera", "Screen", "Price"], [Series("Phone A", [8, 7, 9, 8, 5]), Series("Phone B", [7, 9, 7, 7, 8])])
`)}`,
  },
  {
    id: "parts-of-whole",
    reply: `Pie, radial and single stacked bars show parts of a whole.

${block(`
root = Stack([pie, radial, stacked])
pie = PieChart(["Rent", "Food", "Transport", "Savings"], [1400, 520, 180, 400], "donut")
radial = RadialChart(["Done", "In review", "Not started"], [18, 6, 4])
stacked = SingleStackedBarChart(["Used", "Shared", "Free"], [62, 18, 20])
`)}`,
  },
  {
    id: "scatter",
    reply: `A scatter chart shows how two measures move together.

${block(`
root = Stack([scatter])
scatter = ScatterChart([ScatterSeries("Stores", [Point(12, 140), Point(18, 190), Point(25, 230), Point(31, 260), Point(40, 330), Point(46, 360)])], "Floor area (100 m²)", "Weekly sales ($k)")
`)}`,
  },
  {
    id: "form",
    reply: `A form gathers what the assistant needs, with validation before it sends.

${block(`
root = Stack([formCard])
formCard = Card([header, form])
header = CardHeader("Plan your trip", "A few details to start from")
form = Form("trip", buttons, [fcDestination, fcDates, fcPeople, fcType, fcBudget, fcStay, fcNotes])
buttons = Buttons([Button("Plan my trip", @ToAssistant("Plan a trip from my answers"), "primary"), Button("Surprise me", @ToAssistant("Surprise me with a destination"), "secondary")], "row")
fcDestination = FormControl("Destination", Input("destination", "e.g. Lisbon, Portugal", "text"), "Leave blank for suggestions")
fcDates = FormControl("Travel dates", DatePicker("dates", "range", { required: true }))
fcPeople = FormControl("Travellers", Select("people", [SelectItem("1", "1"), SelectItem("2", "2"), SelectItem("3-4", "3–4"), SelectItem("5+", "5 or more")], "Choose", { required: true }))
fcType = FormControl("Trip type", OptionCards("type", "single", [OptionCard("outdoors", "Outdoors", "Hiking and nature", Icon("mountain", "nature")), OptionCard("city", "City break", "Food, museums and nightlife", Icon("building-2", "buildings"))]))
fcBudget = FormControl("Budget per person (USD)", Slider("budget", "discrete", 500, 5000, 500, [2000], "Budget"))
fcStay = FormControl("Where to stay", Chips("stay", "multiple", [ChipItem("hotel", "Hotel", Icon("building", "buildings")), ChipItem("rental", "Rental", Icon("home", "home")), ChipItem("camping", "Camping", Icon("tent", "nature"))], {}, ["hotel"]))
fcNotes = FormControl("Anything else?", TextArea("notes", "Dietary needs, access requirements, interests", 3))
`)}`,
  },
  {
    id: "choices",
    reply: `Radio groups, checkboxes and switches cover one answer, several answers, and on or off.

${block(`
root = Stack([prefs])
prefs = Form("prefs", buttons, [fcPlan, fcTopics, fcAlerts])
buttons = Buttons([Button("Save preferences", @ToAssistant("Here are my preferences"), "primary")])
fcPlan = FormControl("Plan", RadioGroup("plan", [RadioItem("Monthly", "Billed every month", "monthly"), RadioItem("Yearly", "Two months free", "yearly")], "monthly"))
fcTopics = FormControl("Topics", CheckBoxGroup("topics", [CheckBoxItem("Product news", "New features and fixes", "news"), CheckBoxItem("Guides", "Tips for getting more done", "guides", true)]))
fcAlerts = FormControl("Alerts", SwitchGroup("alerts", [SwitchItem("Email", "A daily summary", "email", true), SwitchItem("Push", "As things happen", "push")], "card"))
`)}`,
  },
  {
    id: "buttons",
    reply: `Buttons continue the conversation or open a link. In this gallery, pressing one shows what it would send.

${block(`
root = Stack([actions, icons])
actions = Buttons([Button("Show me an example", @ToAssistant("Show me an example"), "primary"), Button("Explain it simply", @ToAssistant("Explain it simply"), "secondary"), Button("Read the docs", @OpenUrl("{origin}/docs/ai/generative"), "tertiary")], "row")
icons = Buttons([IconButton("Like this answer", Icon("thumbs-up", "feedback"), @ToAssistant("I liked that answer"), "secondary"), IconButton("Share", Icon("share", "actions"), @ToAssistant("How do I share this?"), "secondary")], "row")
`)}`,
  },
  {
    id: "lists",
    reply: `Lists hold steps or picks; follow-ups suggest what to ask next. A Markdown checklist in a reply can be ticked:

- [ ] Run the tests
- [ ] Update the changelog
- [x] Tag the release

${block(`
root = Stack([list, more])
list = ListBlock([ListItem("Install the CLI", "One command with npm"), ListItem("Sign in", "Opens your browser once"), ListItem("Deploy", "Pushes the current folder", null, "Show me how", @ToAssistant("Show me how to deploy"))], "number")
more = FollowUpBlock([FollowUpItem("How do I roll back a deploy?"), FollowUpItem("Can I deploy from CI?")])
`)}`,
  },
  {
    id: "tabs-accordion",
    reply: `Tabs show alternative views; an accordion keeps detail folded away.

${block(`
root = Stack([tabs, faq])
tabs = Tabs([TabItem("react", "React", [TextContent("A library for building interfaces from components."), Callout("info", "Note", "React uses JSX.")]), TabItem("vue", "Vue", [TextContent("A progressive framework with single-file components."), Callout("success", "Tip", "Vue has a gentle learning curve.")])])
faq = Accordion([AccordionItem("refund", "Can I get a refund?", [TextContent("Yes, within 30 days of purchase.")]), AccordionItem("seats", "Can I add seats later?", [TextContent("Yes. New seats are prorated.")])])
`)}`,
  },
  {
    id: "sections",
    reply: `Sections split a long answer into named parts the reader can fold.

${block(`
root = Stack([sections])
sections = SectionBlock([SectionItem("cause", "What causes it", [TextContent("The cache key ignores the locale, so one language's page is served to everyone.")]), SectionItem("fix", "How to fix it", [CodeBlock("ts", "const key = \`\${path}:\${locale}\`")])], true)
`)}`,
  },
  {
    id: "steps-carousel-modal",
    reply: `Steps lay out a process, a carousel pages through options, and a modal holds a secondary task.

${block(`
root = Stack([steps, carousel, open, details])
$showDetails = false
steps = Steps([StepsItem("Export", "Download your data as CSV."), StepsItem("Map columns", "Match each column to a field."), StepsItem("Import", "Review the preview, then confirm.")])
carousel = Carousel([[CardHeader("Starter", "$0 / month"), TextContent("One project and community support.")], [CardHeader("Team", "$12 / seat"), TextContent("Unlimited projects and shared workspaces.")], [CardHeader("Business", "$30 / seat"), TextContent("SSO, audit logs and priority support.")]], "card")
open = Buttons([Button("Compare all plans", @Set($showDetails, true), "secondary")])
details = Modal("All plans", $showDetails, [Table([Col("Plan", ["Starter", "Team", "Business"]), Col("Price ($/seat)", [0, 12, 30], "number")])], "md")
`)}`,
  },
  {
    id: "data-display",
    reply: `Tags label things; an entity list lines up names and values.

${block(`
root = Stack([tags, entities])
tags = TagBlock(["TypeScript", "React", "Accessibility", "Design systems"])
entities = EntityList([{ left: "Subtotal", right: "$84.00", rightVariant: "number" }, { left: "Shipping", right: "$6.50", rightVariant: "number" }, { left: "Tax", right: "$7.24", rightVariant: "number" }], "default", { left: "Item", right: "Amount", rightVariant: "number" }, { left: "Total", right: "$97.74", rightVariant: "number" })
`)}`,
  },
  {
    id: "metric-cards",
    reply: `Snippet and overview cards summarize figures. All figures are sample data.

${block(`
root = Stack([kpis, overview])
kpis = SnippetCardBlock([kpi1, kpi2, kpi3], "grid", true)
kpi1 = SnippetCardItem("revenue", IconText(Icon("circle-dollar-sign", "finance"), "neutral", "m", "Revenue", "Month to date"), BoldText("number", "$48,200", "+8.1%", "metric"))
kpi2 = SnippetCardItem("users", IconText(Icon("users", "people"), "neutral", "m", "Active users", "This month"), BoldText("number", "1,204", "+3.4%", "metric"))
kpi3 = SnippetCardItem("churn", IconText(Icon("user-minus", "people"), "neutral", "m", "Churn", "This month"), BoldText("number", "1.8%", "-0.3%", "metric"))
overview = OverviewCardBlock([ov1, ov2], "grid", true)
ov1 = OverviewCardItem("orders", Text("text", "Orders"), MetricIndicatorInline("3,420", "Last 30 days", { direction: "up", value: 12 }))
ov2 = OverviewCardItem("refunds", Text("text", "Refunds"), MetricIndicatorInline("41", "Last 30 days", { direction: "down", value: 5 }))
`)}`,
  },
  {
    id: "content-cards",
    reply: `Context, composite and visual cards present things to choose between. Prices and items are sample data.

${block(`
root = Stack([context, products, people, visual])
context = ContextCardBlock([ContextCardItem("tip1", "Shorter meetings", "Default new events to 25 minutes.", "gray"), ContextCardItem("tip2", "Focus time", "Block two hours each morning.", "gray")], "grid", true)
products = CompositeCardBlock([p1, p2], "grid", true)
p1 = CompositeCardItem("pro", IconText(Icon("package", "shopping"), "neutral", "m", "Widget Pro", "Best seller", true), [MetricIndicatorInline("2,410 units", "Sold this month", { direction: "up", value: 12 })], { price: MetricIndicatorWithStrikethrough("$29", "per month", "$39"), button: Button("Choose Pro", @ToAssistant("I'd like Widget Pro"), "secondary") })
p2 = CompositeCardItem("mini", IconText(Icon("box", "shopping"), "neutral", "m", "Widget Mini", "New", true), [MetricIndicatorInline("980 units", "Sold this month", { direction: "up", value: 4 })], { price: BoldText("text", "$14"), button: Button("Choose Mini", @ToAssistant("I'd like Widget Mini"), "secondary") })
people = CompositeCardBlock([t1, t2], "grid", true)
t1 = CompositeCardItem("tpl", ImageTextLarge("${IMAGE}", "CRM workspace", "Client workspace", "Template · 12 views"), [Text("text", "Accounts, deals and notes in one place.")])
t2 = CompositeCardItem("owner", ImageText("{origin}/logo-wordmark.svg", "Honest AI wordmark", "Honest AI", "Workspace owner", true), [EntityList([{ left: "Members", right: "8", rightVariant: "number" }, { left: "Projects", right: "14", rightVariant: "number" }], "small")])
visual = VisualCardBlock([VisualCardItem(BoldText("text", "Client workspace"), "v1", "${IMAGE}", Tag("Template", null, "sm", "info"), "A CRM workspace"), VisualCardItem(BoldText("text", "Sales pipeline"), "v2", "${IMAGE}", Tag("New", null, "sm", "success"), "A CRM workspace")], "grid", true)
`)}`,
  },
  {
    id: "calculator",
    reply: `A calculator recomputes as the reader changes any input. Returns are an assumption.

${block(`
root = Stack([savings, growth])
$monthly = [300]
$rate = "5"
$years = "10"
savings = Calculator([fcMonthly, fcRate, fcYears], [balance, deposited], "Each monthly deposit grows at the annual return ÷ 12, compounded monthly. Returns aren't guaranteed, and this ignores taxes, fees and inflation.")
fcMonthly = FormControl("Monthly deposit ($)", Slider("monthly", "continuous", 50, 2000, 50, [300], "Monthly deposit", null, $monthly))
fcRate = FormControl("Annual return (%)", Input("rate", "5", "number", { required: true, min: 0, max: 20 }, $rate), "An assumption, not a promise")
fcYears = FormControl("Years", Input("years", "10", "number", { required: true, min: 1, max: 50 }, $years))
balance = Result("Final balance", $rate == 0 ? $monthly * 12 * $years : $monthly * (@Pow(1 + $rate / 1200, $years * 12) - 1) / ($rate / 1200), "currency")
deposited = Result("You deposit", $monthly * 12 * $years, "currency")
growth = LineChart(@Each(@Range(1, $years), "y", "Year " + y), [Series("Balance", @Each(@Range(1, $years), "y", $rate == 0 ? $monthly * 12 * y : $monthly * (@Pow(1 + $rate / 1200, y * 12) - 1) / ($rate / 1200)))], "natural", "Year", "Balance ($)")
`)}`,
  },
  {
    id: "simulation",
    reply: `Seeded draws make a simulation the reader can run again. A fair die shows a six about one roll in six.

${block(`
root = Stack([dice])
$run = 1
$rolls = "600"
dice = Calculator([fcRolls], [sixes], "Each roll is a fair six-sided die; a run counts the sixes.", again)
fcRolls = FormControl("Rolls", Input("rolls", "600", "number", { required: true, min: 1, max: 10000 }, $rolls))
sixes = Result("Sixes rolled", @Sum(@Each(@Range(1, $rolls), "t", @Random([$run, t, "die"], 1, 6) == 6 ? 1 : 0)))
again = Buttons([Button("Roll again", @Set($run, $run + 1), "secondary")])
`)}`,
  },
  {
    id: "quiz",
    reply: `A quiz marks answers after the reader submits, then explains each one.

${block(`
root = Stack([quiz])
quiz = Quiz([q1, q2])
q1 = QuizQuestion("Given \`int x = 10; int *p = &x;\`, what is \`*p\`?", ["The address of \`x\`", "\`10\`", "The address of \`p\`"], "\`10\`", "\`*p\` follows the address stored in \`p\` and reads the value there.")
q2 = QuizQuestion("Which statement changes \`x\` through \`p\`?", ["\`p = 20;\`", "\`*p = 20;\`", "\`&p = 20;\`"], "\`*p = 20;\`", "\`*p\` names the memory \`p\` points to.")
`)}`,
  },
  {
    id: "diagrams",
    reply: `A diagram shows how one thing leads to the next; a parts diagram labels what one thing is made of.

${block(`
root = Stack([pointer, chain, url, layers, box])
pointer = Diagram([p, x], ["points to"], "Example addresses for illustration")
p = DiagramNode("Pointer \`p\`", "0x100", "Holds the address of \`x\`")
x = DiagramNode("Variable \`x\`", "10", "Stored at address 0x100")
chain = Diagram([phone, transport, electron], ["QUIC stream", "stdin/stdout JSON lines"], "Phone side, top layer first")
phone = DiagramNode("Phone", "mobile-link-client", "Sends a versioned request {version, id, method, params}")
transport = DiagramNode("Desktop transport", "handwork-mobile-host", "Rust child process; only handles QUIC")
electron = DiagramNode("Electron main", "mobile-host.mjs", "Owns workspace state and secrets; answers the request")
layers = PartsDiagram([app, tls, tcp, ip], "stack", "Top layer first.")
app = DiagramPart("Application", "HTTP/2", "Requests and responses")
tls = DiagramPart("Security", "TLS 1.3", "Encrypts the stream")
tcp = DiagramPart("Transport", "TCP", "Ordered, reliable bytes")
ip = DiagramPart("Network", "IPv6", "Routes packets between hosts")
box = PartsDiagram([margin, border, padding, content], "nested", "CSS box model, outermost first.")
margin = DiagramPart("Margin", "16px", "Space outside the border")
border = DiagramPart("Border", "1px", "The visible edge")
padding = DiagramPart("Padding", "12px", "Space inside the border")
content = DiagramPart("Content", "320 × 80", "Text and children")
url = PartsDiagram([scheme, host, path, query], "row", "Read it left to right.")
scheme = DiagramPart("Scheme", "https://", "How to connect")
host = DiagramPart("Host", "example.com", "Which server", 2)
path = DiagramPart("Path", "/docs/page", "Which resource", 2)
query = DiagramPart("Query", "?lang=en", "Extra parameters")
`)}`,
  },
  {
    id: "map",
    reply: `A map places real places by name; your app looks each one up. Every place is also listed below it.

${block(`
root = Stack([trip])
trip = Map([denver, arches, moab], "route", "Stops in driving order. The map numbers the stops; it doesn't draw the roads.")
denver = MapPlace("Denver", "Denver, Colorado, USA", "Start")
arches = MapPlace("Arches National Park", "Arches National Park, Utah, USA", "Delicate Arch trail")
moab = MapPlace("Moab", "Moab, Utah, USA", "Overnight")
`)}`,
  },
  {
    id: "artifact",
    reply: `An artifact opens beside the conversation, where the reader can edit, copy or download it, or select a passage to ask about.

${block(`
root = Stack([plan])
plan = Artifact("Onboarding plan", [doc], "Markdown · 4 weeks")
doc = MarkDownRenderer("## Week 1: Setup\\n- Laptop, accounts and access\\n- Meet the team\\n\\n## Week 2: Shadowing\\n- Pair on two tickets\\n\\n## Week 3: First task\\n- Ship one small change\\n\\n## Week 4: Review\\n- Check-in with your manager")
`)}`,
  },
  {
    id: "html-visual",
    reply: `When no component can draw it, the model writes HTML and SVG that run in a sandbox. Press **Next** to send each message.

${block(`
root = Stack([handshake])
handshake = HtmlVisual("TCP three-way handshake", "<div style='display:grid;gap:8px'><svg viewBox='0 0 320 124' width='100%' style='max-width:440px' role='img' aria-label='A client and a server exchange SYN, SYN-ACK and ACK'><text x='24' y='16' fill='var(--muted)'>Client</text><text x='250' y='16' fill='var(--muted)'>Server</text><line x1='40' y1='24' x2='40' y2='120' stroke='var(--border)'/><line x1='270' y1='24' x2='270' y2='120' stroke='var(--border)'/><g id=g0 style='display:none'><line x1='40' y1='48' x2='270' y2='48' stroke='var(--chart-1)' stroke-width='2'/><text x='155' y='42' text-anchor='middle' fill='var(--foreground)'>SYN</text></g><g id=g1 style='display:none'><line x1='270' y1='78' x2='40' y2='78' stroke='var(--chart-2)' stroke-width='2'/><text x='155' y='72' text-anchor='middle' fill='var(--foreground)'>SYN-ACK</text></g><g id=g2 style='display:none'><line x1='40' y1='108' x2='270' y2='108' stroke='var(--chart-1)' stroke-width='2'/><text x='155' y='102' text-anchor='middle' fill='var(--foreground)'>ACK</text></g></svg><button id=n style='justify-self:start;padding:6px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface)'>Next</button></div><script>const steps=[g0,g1,g2];let i=0;n.onclick=()=>{if(i===steps.length){steps.forEach(g=>g.style.display='none');i=0;n.textContent='Next';return}steps[i++].style.display='';if(i===steps.length)n.textContent='Start over'}</script>", "Press Next to send each message", 200)
`)}`,
  },
  {
    id: "canvas-visual",
    reply: `A visual can animate on a canvas with the page's colors. Set the speed and angle, then press **Launch**. Air resistance is ignored.

${block(`
root = Stack([sim])
sim = HtmlVisual("Projectile motion", "<div style='display:grid;gap:12px'><div style='display:flex;flex-wrap:wrap;gap:16px'><label style='display:grid;gap:2px'>Launch speed: <b id=sv>40 m/s</b><input id=speed type=range min=10 max=60 value=40></label><label style='display:grid;gap:2px'>Launch angle: <b id=av>45°</b><input id=angle type=range min=5 max=85 value=45></label></div><canvas id=c height=220 style='width:100%;background:var(--surface)' aria-label='Projectile path'></canvas><div style='display:flex;gap:8px;align-items:center'><button id=go>Launch</button><button id=reset>Reset</button><span id=out style='font-size:13px;color:var(--muted)'></span></div></div><script>const g=9.81,cv=c,ctx=cv.getContext('2d');let raf=0,trail=[];function size(){const r=devicePixelRatio||1;cv.width=cv.clientWidth*r;cv.height=220*r;ctx.setTransform(r,0,0,r,0,0)}function range(){const v=+speed.value,a=angle.value*Math.PI/180;return{v,a,R:v*v*Math.sin(2*a)/g,H:(v*Math.sin(a))**2/(2*g),T:2*v*Math.sin(a)/g}}function draw(p){const w=cv.clientWidth,h=220,s=Math.min((w-40)/370,(h-40)/185);ctx.clearRect(0,0,w,h);ctx.strokeStyle='var(--border)';ctx.beginPath();ctx.moveTo(20,h-20);ctx.lineTo(w-20,h-20);ctx.stroke();ctx.strokeStyle='var(--chart-1)';ctx.lineWidth=2;ctx.beginPath();trail.forEach(([x,y],i)=>{const X=20+x*s,Y=h-20-y*s;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)});ctx.stroke();ctx.lineWidth=1;if(p){ctx.fillStyle='var(--chart-2)';ctx.beginPath();ctx.arc(20+p[0]*s,h-20-p[1]*s,6,0,7);ctx.fill()}}function labels(){sv.textContent=speed.value+' m/s';av.textContent=angle.value+'°';const r=range();out.textContent='Range '+r.R.toFixed(1)+' m · peak '+r.H.toFixed(1)+' m · '+r.T.toFixed(2)+' s'}function launch(){cancelAnimationFrame(raf);trail=[];const r=range(),start=performance.now();function step(now){const t=Math.min((now-start)/1000,r.T),p=[r.v*Math.cos(r.a)*t,r.v*Math.sin(r.a)*t-g*t*t/2];trail.push(p);draw(p);if(t<r.T)raf=requestAnimationFrame(step)}raf=requestAnimationFrame(step)}go.onclick=launch;reset.onclick=()=>{cancelAnimationFrame(raf);trail=[];draw()};speed.oninput=angle.oninput=labels;size();labels();draw();addEventListener('resize',()=>{size();draw(trail[trail.length-1])})</script>", "Range = v² sin 2θ / g, with g = 9.81 m/s²", 320)
`)}`,
  },
];

export const gallerySamples: Record<string, GallerySample> = Object.fromEntries(
  samples.map((sample) => [sample.id, sample]),
);

/** The program inside a sample's fence, for the Source view. */
export function sampleProgram(reply: string) {
  return reply.match(/```honestai\n([\s\S]*?)\n```/)?.[1] ?? "";
}
