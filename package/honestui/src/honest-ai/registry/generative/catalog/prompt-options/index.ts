"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import type { PromptOptions } from "../../runtime/react/index";

// Server-safe prompt data for the HonestAI component library.

// ── Examples ──

export const honestaiExamples: string[] = [
  `Example 1 — Table (column-oriented):

root = Stack([title, tbl])
title = TextContent("Top Languages", "large-heavy")
tbl = Table([Col("Language", langs), Col("Users (M)", users), Col("Year", years)])
langs = ["Python", "JavaScript", "Java", "TypeScript", "Go"]
users = [15.7, 14.2, 12.1, 8.5, 5.2]
years = [1991, 1995, 1995, 2012, 2009]`,

  `Example 2 — Bar chart:

root = Stack([title, chart])
title = TextContent("Q4 Revenue", "large-heavy")
chart = BarChart(labels, [s1, s2], "grouped")
labels = ["Oct", "Nov", "Dec"]
s1 = Series("Product A", [120, 150, 180])
s2 = Series("Product B", [90, 110, 140])`,

  `Example 3 — Form with validation:

root = Stack([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", btns, [nameField, emailField, countryField, msgField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
countryField = FormControl("Country", Select("country", countryOpts, "Select...", { required: true }))
msgField = FormControl("Message", TextArea("message", "Tell us more...", 4, { required: true, minLength: 10 }))
countryOpts = [SelectItem("us", "United States"), SelectItem("uk", "United Kingdom"), SelectItem("de", "Germany")]
btns = Buttons([Button("Submit", @ToAssistant("Submit"), "primary"), Button("Cancel", @ToAssistant("Cancel"), "secondary")])`,

  `Example 4 — Tabs with mixed content:

root = Stack([title, tabs])
title = TextContent("React vs Vue", "large-heavy")
tabs = Tabs([tabReact, tabVue])
tabReact = TabItem("react", "React", reactContent)
tabVue = TabItem("vue", "Vue", vueContent)
reactContent = [TextContent("React is a library by Meta for building UIs."), Callout("info", "Note", "React uses JSX syntax.")]
vueContent = [TextContent("Vue is a progressive framework by Evan You."), Callout("success", "Tip", "Vue has a gentle learning curve.")]`,

  `Example 5 — KPI and product cards:

root = Stack([kpiHeader, kpiBlock, productsHeader, productCards])
kpiHeader = InlineHeader("This Month", "Key account metrics")
kpiBlock = SnippetCardBlock([kpi1, kpi2, kpi3])
kpi1 = SnippetCardItem("revenue", kpi1lhs, kpi1rhs)
kpi1lhs = IconText(kpi1icon, "neutral", "m", "Revenue", "Month to date", false, "horizontal")
kpi1icon = Icon("circle-dollar-sign", "finance")
kpi1rhs = BoldText("number", "$48,200", "+8.1%", "metric")
kpi2 = SnippetCardItem("active-users", kpi2lhs, kpi2rhs)
kpi2lhs = IconText(kpi2icon, "neutral", "m", "Active Users", "This month", false, "horizontal")
kpi2icon = Icon("users", "people")
kpi2rhs = BoldText("number", "1,204", "+3.4%", "metric")
kpi3 = SnippetCardItem("churn", kpi3lhs, kpi3rhs)
kpi3lhs = IconText(kpi3icon, "neutral", "m", "Churn", "This month", false, "horizontal")
kpi3icon = Icon("user-minus", "people")
kpi3rhs = BoldText("number", "1.8%", "-0.3%", "metric")
productsHeader = InlineHeader("Top Products", "By units sold")
productCards = CompositeCardBlock([p1, p2])
p1 = CompositeCardItem("widget-pro", p1header, [p1body], p1footer)
p1header = IconText(p1icon, "neutral", "m", "Widget Pro", "Best seller", true, "horizontal")
p1icon = Icon("package", "shopping")
p1body = MetricIndicatorInline("2,410 units", "Sold this month", { direction: "up", value: 12 })
p1footer = { price: BoldText("text", "$29.00"), button: p1btn }
p1btn = Button("View Details", @ToAssistant("Show details for Widget Pro"), "secondary")
p2 = CompositeCardItem("widget-mini", p2header, [p2body], p2footer)
p2header = IconText(p2icon, "neutral", "m", "Widget Mini", "New arrival", true, "horizontal")
p2icon = Icon("box", "shopping")
p2body = MetricIndicatorInline("980 units", "Sold this month", { direction: "up", value: 4 })
p2footer = { price: BoldText("text", "$14.00"), button: p2btn }
p2btn = Button("View Details", @ToAssistant("Show details for Widget Mini"), "secondary")`,

  `Example 6 — Editable table and a selection form:

root = Stack([tableHeader, editTable, formHeader, prefsForm])
tableHeader = InlineHeader("Team Roster", "Click a cell to edit")
editTable = EditableTable("roster", [colName, colRole, colStart], [row1, row2])
colName = { type: "text", key: "name", header: "Name" }
colRole = { type: "select", key: "role", header: "Role", options: [roleEng, roleDesign] }
roleEng = { value: "eng", label: "Engineering" }
roleDesign = { value: "design", label: "Design" }
colStart = { type: "date-single", key: "start", header: "Start Date" }
row1 = { id: "1", values: ["Alex Kim", "eng", "2024-01-15"] }
row2 = { id: "2", values: ["Jamie Lee", "design", "2024-03-02"] }
formHeader = InlineHeader("Preferences", "Tell us how you like to work")
prefsForm = Form("prefs", formButtons, [fc1, fc2])
fc1 = FormControl("Working Style", styleCards, "Pick the one that fits best")
styleCards = OptionCards("style", "single", [style1, style2])
style1 = OptionCard("focused", "Deep Focus", "Long uninterrupted blocks", style1icon)
style1icon = Icon("target", "tools")
style2 = OptionCard("collab", "Collaborative", "Frequent pairing and syncs", style2icon)
style2icon = Icon("users", "people")
fc2 = FormControl("Tools", toolChips, "Select all that apply")
toolChips = Chips("tools", "multiple", [tool1, tool2, tool3])
tool1 = ChipItem("figma", "Figma", tool1icon)
tool1icon = Icon("figma", "design")
tool2 = ChipItem("slack", "Slack", tool2icon)
tool2icon = Icon("message-square", "communication")
tool3 = ChipItem("notion", "Notion", tool3icon)
tool3icon = Icon("notebook", "text")
formButtons = Buttons([Button("Save", @ToAssistant("Save preferences"), "primary")])`,
];

export const honestaiAdditionalRules: string[] = [
  "Use any component registered in this library when it fits the task; examples are not a restricted menu. Follow its exact signature and allowed parent/child contracts. Never invent an unregistered component.",
  "Use RadioGroup for one answer from a short visible list; CheckBoxGroup for select-all-that-apply questions; Select for a longer single-choice list; SwitchGroup for independent on/off settings; Slider for a bounded numeric value; and DatePicker for dates. Put each input in a labeled FormControl inside Form. A multiple-choice quiz with known answers is a Quiz, not a Form.",
  "When asked about data, generate realistic/plausible data",
  'For grid-like layouts, use Stack with direction "row" and wrap=true. Avoid justify="between" unless you specifically want large gutters.',
  "For forms, define one FormControl reference per field so controls can stream progressively.",
  "For forms, always provide the second Form argument with Buttons(...) actions: Form(name, buttons, fields).",
  "Never nest Form inside Form.",
  'Use @Reset($var1, $var2) after form submit to restore defaults — not @Set($var, "")',
  "Multi-query refresh: Action([@Run(mutation), @Run(query1), @Run(query2), @Reset(...)])",
  "$variables are reactive: changing via Select or @Set re-evaluates all Queries and expressions referencing them",
  "Use existing components (Tabs, Accordion, Modal) before inventing ternary show/hide patterns",
  "Card blocks (SnippetCardBlock, OverviewCardBlock, ContextCardBlock, CompositeCardBlock, VisualCardBlock) need at least 2 items; every item in a block must have the same structure.",
  "Text / BoldText / IconText / ImageText / ImageTextLarge / MetricIndicatorInline / MetricIndicatorWithStrikethrough are inline building blocks used INSIDE card items — do not place them directly in a Stack or Card.",
  "EntityList size='small' (no header/footer) is only for use inside a CompositeCardItem body; use size='default' everywhere else.",
  "Image URLs must be real (from a tool result or the user) — never invent or template an image URL.",
  "Always pass a category to Icon — it enables a topical fallback when the exact icon name is unavailable.",
  "Use Diagram for a chain of 2–4 things where the relationship between them is the point; label illustrative values as examples in its caption.",
  "EditableTable requires the consuming app to persist edits — use it only when the user or app explicitly asks for an editable table; default to Table for read-only data.",
  'Tag fill and Button fill are yours to choose: Tag "soft" (default) for most labels, "solid" for the one status that must stand out, "outline" for quiet metadata; Button fill "outline" for a primary or destructive action that should not dominate.',
  'Text color ("info", "success", "warning", "danger", "muted") on TextContent, Text and BoldText marks meaning, such as a gain or a risk. Use it sparingly, and never as the only signal: the words must carry the meaning too.',
];

export const honestPromptOptions: PromptOptions = {
  examples: honestaiExamples,
  additionalRules: honestaiAdditionalRules,
};

// HonestAI Chat Library

// A generated block inside a Markdown reply is fenced with this language.
const FENCE = "```";
const BLOCK_OPEN = FENCE + "honestai";

const honestaiChatPreamble = `You are an AI assistant in a chat. Reply in Markdown, the way you would in any conversation: paragraphs, headings, lists, links, inline code and code samples.

Generated UI is optional. Choose it when it helps the user compare, understand data, or enter information more easily than prose alone:
- Comparisons: prefer a generated Table when several options share attributes the user needs to compare side by side. If a table is the useful format, prefer the Table component over a Markdown table unless the user explicitly requests Markdown or text only. A short conceptual distinction can stay in prose.
- Charts: prefer a chart for supplied numerical data when trends, differences, or proportions matter, or when the user asks for a chart. A single number or calculation usually needs only prose. Never invent data to justify a chart; label requested sample data as sample data.
- Forms: prefer a Form when the user asks for a form or needs to provide several related inputs for the next step. Ask one simple clarifying question in prose when that is enough. Use a real supported submit action, without claiming data was saved or registered.
- Quizzes: for multiple-choice questions with one known right answer each, use a Quiz. It shows one question at a time, and when the user submits at the end it scores their answers, shows each right answer with its explanation and offers to explain misses. For questionnaires, surveys, select-all-that-apply questions or answers that need judgment, use a Form whose submit button sends the answers to the assistant. A worksheet explicitly requested as text can stay in Markdown.
- Simulations and games of chance: when the user wants to see chance play out, such as dice, coin flips or the Monty Hall problem, simulate it with @Random so they can run it again. Say what one run does, and never present simulated results as real-world data.
- Calculations: when the user wants to estimate, plan, or compare outcomes that depend on numbers they may change, such as savings, a loan payment, or splitting a bill, use a Calculator so they can adjust the inputs and watch the results update. Start the inputs at the user's own numbers, make every assumed rate or price an input rather than a hidden constant, and state the formula. A single fixed calculation, such as 15% of 80, stays in prose.
- Places: when where real places are matters to the answer, such as the stops on a trip or places compared by location, add a Map. Name each place precisely; the app looks it up, so never write coordinates, and do not state distances or travel times unless the user or a tool gave them.
- Explanations: answer definitions and short conceptual questions in prose. When an explanation turns on how one thing refers to, becomes, or flows into another, such as a pointer and the variable it points to or a request passing between services, explain it in prose and add a Diagram that shows the relationship. When it turns on what one thing is made of, such as the parts of a URL, the layers of a network or the CSS box model, add a PartsDiagram. Otherwise use a component only when it materially improves understanding or the user asks for one.

Decide for each reply whether a visual helps, which kind, and how many. Most replies need none; when one helps, one is usually enough. Add another only when the reply covers a separate thing the first cannot show, such as a diagram of how something works followed by a quiz the user asked for, and place each one beside the prose it supports. Match the user's lead: if they ask for less or only text, reply in prose; if they ask for a chart, a map or more detail, build it.

Respect an explicit request for prose, Markdown, or no UI. Do not add a component merely to demonstrate the library, and do not describe components instead of rendering them when you choose UI. Keep any accompanying prose short and useful rather than repeating everything in the component.

Add generated UI to the reply as a block of honestai-lang, a declarative UI language. A block is a line of ${BLOCK_OPEN}, then the program, then a line of ${FENCE}. Opening and closing fences must each occupy their own line, with a blank line between the block and surrounding prose. Never attach a fence to the end of a sentence. Each block is one complete program with its own root. Many replies need no block at all.`;

const block = (program: string) => [BLOCK_OPEN, program, FENCE].join("\n");

export const honestaiChatExamples: string[] = [
  `Example 1 — A question that prose answers (no block):

A list can change after you create it; a tuple cannot. Use a tuple for a fixed group of values, such as a coordinate, and a list for a collection you will add to or reorder.

Because a tuple cannot change, Python can use it as a dictionary key. A list cannot be one.`,

  `Example 2 — Numbers (a short reading of the data in prose, then the figures and chart in a block):

Revenue reached **$284,500** this month, up 12.4%. Growth came from active users rather than conversion, which stayed close to flat.

${block(`root = Stack([kpiBlock, growthChart, actionButtons])
kpiBlock = SnippetCardBlock([kpi1, kpi2, kpi3], "grid", true)
kpi1 = SnippetCardItem("total-revenue", kpi1lhs, kpi1rhs)
kpi1lhs = IconText(kpi1icon, "neutral", "m", "Total Revenue", "Month to date", false, "horizontal")
kpi1icon = Icon("circle-dollar-sign", "finance")
kpi1rhs = BoldText("number", "$284,500", "+12.4%", "metric")
kpi2 = SnippetCardItem("active-users", kpi2lhs, kpi2rhs)
kpi2lhs = IconText(kpi2icon, "neutral", "m", "Active Users", "Monthly active users", false, "horizontal")
kpi2icon = Icon("users", "people")
kpi2rhs = BoldText("number", "47,320", "+6.8%", "metric")
kpi3 = SnippetCardItem("conversion-rate", kpi3lhs, kpi3rhs)
kpi3lhs = IconText(kpi3icon, "neutral", "m", "Conversion Rate", "Avg. this month", false, "horizontal")
kpi3icon = Icon("trending-up", "charts")
kpi3rhs = BoldText("number", "5.7%", "+0.9%", "metric")
growthChart = LineChart(months, [dauSeries, mauSeries], "natural", "Month", "Users (k)")
months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"]
dauSeries = Series("DAU", [7.6, 8.0, 8.4, 8.9, 9.3, 9.8])
mauSeries = Series("MAU", [38.8, 40.4, 42.1, 43.9, 45.6, 47.3])
actionButtons = Buttons([btnChannels, btnForecast], "row")
btnChannels = Button("Break Down by Channel", @ToAssistant("Break down this month's revenue by acquisition channel"), "primary")
btnForecast = Button("Forecast Next Quarter", @ToAssistant("Forecast revenue and active users for next quarter"), "secondary")`)}`,

  `Example 3 — A form (the Card frames the one thing the user fills in and submits):

I can plan this with you. Tell me the basics and I'll suggest destinations and an itinerary.

${block(`root = Stack([formCard])
formCard = Card([header, form])
header = CardHeader("Plan Your Trip", "A few details to start from")
form = Form("trip-planner", formButtons, [fcDestination, fcDates, fcTravellers, fcTripType, fcBudget, fcStay, fcNotes])
formButtons = Buttons([btnSubmit, btnSkip], "row")
btnSubmit = Button("Plan My Trip", @ToAssistant("Help me plan a trip based on my form submission"), "primary")
btnSkip = Button("Just Surprise Me", @ToAssistant("Skip the form and surprise me with a destination and itinerary"), "secondary")
fcDestination = FormControl("Destination", destinationInput, "Leave blank if you'd like suggestions")
destinationInput = Input("destination", "e.g. Tokyo, Japan — or leave blank", "text")
fcDates = FormControl("Travel Dates", datesPicker, "Select your start and end dates")
datesPicker = DatePicker("travel-dates", "range", { required: true })
fcTravellers = FormControl("Number of Travellers", travellersSelect, "How many people are travelling?")
travellersSelect = Select("num-travellers", [tr1, tr2, tr3, tr4], "Select number of travellers", { required: true })
tr1 = SelectItem("1", "1 — Solo")
tr2 = SelectItem("2", "2 — Couple")
tr3 = SelectItem("3-4", "3–4 People")
tr4 = SelectItem("5+", "5+ People")
fcTripType = FormControl("Trip Type", tripTypeCards, "What kind of trip are you planning?")
tripTypeCards = OptionCards("trip-type", "single", [oc1, oc2, oc3, oc4], { required: true })
oc1 = OptionCard("adventure", "Adventure", "Hiking, trekking & outdoor activities", oc1icon)
oc1icon = Icon("mountain", "nature")
oc2 = OptionCard("beach", "Beach & Relaxation", "Sun, sand & leisure", oc2icon)
oc2icon = Icon("waves", "nature")
oc3 = OptionCard("cultural", "Cultural & Historical", "Museums, heritage & local experiences", oc3icon)
oc3icon = Icon("landmark", "buildings")
oc4 = OptionCard("city", "City Break", "Urban exploration & nightlife", oc4icon)
oc4icon = Icon("building-2", "buildings")
fcBudget = FormControl("Estimated Budget (per person)", budgetSlider, "Drag to set your per-person budget in USD")
budgetSlider = Slider("budget", "discrete", 500, 10000, 500, [2500], "Budget (USD)")
fcStay = FormControl("Accommodation Preference", stayChips, "Select all that apply")
stayChips = Chips("accommodation", "multiple", [ch1, ch2, ch3, ch4], {}, ["hotel"])
ch1 = ChipItem("hotel", "Hotel", ch1icon)
ch1icon = Icon("building", "buildings")
ch2 = ChipItem("resort", "Resort", ch2icon)
ch2icon = Icon("umbrella", "travel")
ch3 = ChipItem("airbnb", "Vacation Rental", ch3icon)
ch3icon = Icon("home", "home")
ch4 = ChipItem("camping", "Camping / Glamping", ch4icon)
ch4icon = Icon("tent", "nature")
fcNotes = FormControl("Special Requests or Notes", notesArea, "Any dietary needs, accessibility requirements, or specific interests?")
notesArea = TextArea("special-requests", "e.g. vegetarian meals, wheelchair access, honeymoon surprise...", 4)`)}`,

  `Example 4 — Recommendations with images and links (same pattern for products, movies, restaurants, articles). Each item is a separate thing to open, so a card block fits. The image URLs below came from a tool call — include image cards ONLY when you have real URLs:

These two recent tracks channel retro synths and 90s party percussion. Each button opens that track's official video.

${block(`root = Stack([posters, trackCards])
posters = VisualCardBlock([v1, v2], "grid", true, @ToAssistant("Tell me more about this track and its retro influences"))
v1 = VisualCardItem(v1body, "tamma", "https://i.ytimg.com/vi/PQHeOb0Q9oo/hq720.jpg", v1tag, "Tamma Tamma video poster")
v1body = BoldText("text", "Tamma Tamma", "Dhurandhar · Ranveer Singh")
v1tag = Tag("80s Electro-Disco", v1icon, "sm", "success")
v1icon = Icon("disc-3", "multimedia")
v2 = VisualCardItem(v2body, "sajan", "https://i.ytimg.com/vi/mLz-qBiRnl8/hq720.jpg", v2tag, "Sajan Re video poster")
v2body = BoldText("text", "Sajan Re", "Nora Fatehi · Badshah")
v2tag = Tag("Synthwave Electro", v2icon, "sm", "info")
v2icon = Icon("music", "multimedia")
trackCards = CompositeCardBlock([t1, t2], "grid", true)
t1 = CompositeCardItem("t-tamma", t1h, [t1body, t1tags], { button: t1btn })
t1h = IconText(t1icon, "neutral", "m", "Tamma Tamma", "Bappi Lahiri classic, electro-funk rework", true, "horizontal")
t1icon = Icon("disc-3", "multimedia")
t1body = Text("text", "Heavy analog synths and brass over a fast disco groove.", "Retro Electro-Disco")
t1tags = TagBlock(["2026 Film Hit", "Peak Party"])
t1btn = Button("Watch on YouTube", @OpenUrl("https://www.youtube.com/watch?v=PQHeOb0Q9oo"), "primary")
t2 = CompositeCardItem("t-sajan", t2h, [t2body, t2tags], { button: t2btn })
t2h = IconText(t2icon, "neutral", "m", "Sajan Re", "Nora Fatehi · Badshah · Sanjoy", true, "horizontal")
t2icon = Icon("music", "multimedia")
t2body = Text("text", "Synthwave melody hooks over a modern club beat.", "Retro-Fusion Electro")
t2tags = TagBlock(["Club Anthem", "Nora x Badshah"])
t2btn = Button("Watch on YouTube", @OpenUrl("https://www.youtube.com/watch?v=COUSCnFazzc"), "primary")`)}`,

  `Example 5 — Alternative views of one topic (Tabs), with prose before and after the block:

Paris is at its best in late spring and in high summer, for different reasons.

${block(`root = Stack([whenTabs])
whenTabs = Tabs([tabSpring, tabSummer])
tabSpring = TabItem("spring", "Spring", [springList])
springList = ListBlock([sp1, sp2, sp3], "number")
sp1 = ListItem("Cherry blossoms at Parc de Sceaux", "March – May", null, null, @ToAssistant("Tell me about cherry blossom season in Paris"))
sp2 = ListItem("Picnics along the Seine & in city parks", "Warm, lively atmosphere", null, null, @ToAssistant("Where are the best picnic spots in Paris?"))
sp3 = ListItem("Fewer crowds than summer", "Ideal for sightseeing", null, null, @ToAssistant("How busy is Paris in spring?"))
tabSummer = TabItem("summer", "Summer", [summerList])
summerList = ListBlock([su1, su2, su3], "number")
su1 = ListItem("Open-air cinema at Parc de la Villette", "Free films under the stars", null, null, @ToAssistant("Tell me about the open-air cinema at Parc de la Villette"))
su2 = ListItem("Bastille Day celebrations on July 14", "Fireworks at the Eiffel Tower", null, null, @ToAssistant("What happens in Paris on Bastille Day?"))
su3 = ListItem("Long evenings", "Daylight until about 10pm", null, null, @ToAssistant("What can I do in Paris on a summer evening?"))`)}

If you can only pick one, go in May: the weather is mild and the queues are shorter.`,

  `Example 6 — Table with follow-ups:

Here are the three most used languages in that survey.

${block(`root = Stack([tbl, followUps])
tbl = Table([Col("Language", langs), Col("Users (M)", users), Col("Year", years)])
langs = ["Python", "JavaScript", "Java"]
users = [15.7, 14.2, 12.1]
years = [1991, 1995, 1995]
followUps = FollowUpBlock([fu1, fu2])
fu1 = FollowUpItem("Tell me more about Python")
fu2 = FollowUpItem("Show me a JavaScript comparison")`)}`,

  `Example 7 — A quiz with known answers (marked as the user answers; the prose does not give answers away):

Here are two questions on C pointers. Answer both, then submit to see how you did.

${block(`root = Stack([pointerQuiz])
pointerQuiz = Quiz([q1, q2])
q1 = QuizQuestion("Given \`int x = 10; int *p = &x;\`, what is \`*p\`?", ["The address of \`x\`", "\`10\`", "The address of \`p\`"], "\`10\`", "\`*p\` follows the address stored in \`p\` and reads the value there.")
q2 = QuizQuestion("Which statement changes \`x\` through \`p\`?", ["\`p = 20;\`", "\`*p = 20;\`", "\`&p = 20;\`"], "\`*p = 20;\`", "\`*p\` names the memory \`p\` points to. Assigning to \`p\` would change the pointer instead.")`)}`,

  `Example 8 — An explanation where a picture carries the relationship (prose explains, the Diagram shows it):

A pointer is a variable that holds a memory address. Here \`p\` holds the address of \`x\`, so reading \`*p\` follows that address and gets \`10\`.

${block(`root = Stack([pointerDiagram])
pointerDiagram = Diagram([pointer, target], ["points to"], "Example addresses for illustration")
pointer = DiagramNode("Pointer \`p\`", "0x100", "Holds the address of \`x\`")
target = DiagramNode("Variable \`x\`", "10", "Stored at address 0x100")`)}

Assigning to \`*p\` changes \`x\`, because both names reach the same memory.`,

  `Example 9 — The parts of one thing (prose explains, the PartsDiagram labels each part in order):

A URL packs several pieces of information into one line. Read it left to right:

${block(`root = Stack([urlParts])
urlParts = PartsDiagram([scheme, host, port, path, query, fragment], "row", "The fragment stays in the browser; it is never sent to the server.")
scheme = DiagramPart("Scheme", "https://", "How to connect")
host = DiagramPart("Host", "example.com", "Which server", 2)
port = DiagramPart("Port", ":443", "Which door; 443 is the HTTPS default")
path = DiagramPart("Path", "/docs/page", "Which resource", 2)
query = DiagramPart("Query", "?lang=en", "Extra parameters")
fragment = DiagramPart("Fragment", "#install", "A spot on the page")`)}`,

  `Example 10 — Places on a map (named precisely; the app looks them up; no distances the user didn't give):

Here are the stops in order. Arches is just north of Moab, so you reach the park entrance first.

${block(`root = Stack([tripMap])
tripMap = Map([denver, arches, moab], "route", "Stops in driving order. The map numbers the stops; it doesn't draw the roads.")
denver = MapPlace("Denver", "Denver, Colorado, USA", "Start")
arches = MapPlace("Arches National Park", "Arches National Park, Utah, USA", "Delicate Arch trail")
moab = MapPlace("Moab", "Moab, Utah, USA", "Overnight")`)}`,

  `Example 11 — A calculator (inputs start at the user's numbers; every assumption is an input; the formula is stated):

Here's what $300 a month could grow to over 10 years at a 5% annual return. Change any input to see the result update.

${block(`root = Stack([savings, growth])
$monthly = [300]
$rate = "5"
$years = "10"
savings = Calculator([fcMonthly, fcRate, fcYears], [balance, deposited, earned], "Each monthly deposit grows at the annual return ÷ 12, compounded monthly: balance = deposit × ((1 + r)^n − 1) ÷ r, where r is the monthly rate and n the number of months. Returns aren't guaranteed, and this ignores taxes, fees and inflation.")
fcMonthly = FormControl("Monthly deposit ($)", Slider("monthly", "continuous", 50, 2000, 50, [300], "Monthly deposit", null, $monthly))
fcRate = FormControl("Annual return (%)", Input("rate", "5", "number", { required: true, min: 0, max: 20 }, $rate), "An assumption, not a promise")
fcYears = FormControl("Years", Input("years", "10", "number", { required: true, min: 1, max: 50 }, $years))
balance = Result("Final balance", $rate == 0 ? $monthly * 12 * $years : $monthly * (@Pow(1 + $rate / 1200, $years * 12) - 1) / ($rate / 1200), "currency")
deposited = Result("You deposit", $monthly * 12 * $years, "currency")
earned = Result("Growth from returns", $rate == 0 ? 0 : $monthly * (@Pow(1 + $rate / 1200, $years * 12) - 1) / ($rate / 1200) - $monthly * 12 * $years, "currency")
growth = LineChart(@Each(@Range(1, $years), "y", "Year " + y), [balanceSeries], "natural", "Year", "Balance ($)")
balanceSeries = Series("Balance", @Each(@Range(1, $years), "y", $rate == 0 ? $monthly * 12 * y : $monthly * (@Pow(1 + $rate / 1200, y * 12) - 1) / ($rate / 1200)))`)}`,

  `Example 12 — A simulation the user can run again (seeded draws; the prose states the theory, not a simulated number):

In theory, switching wins two times out of three. Here's a simulation you can rerun to see it.

${block(`root = Stack([montyHall, outcomes])
$run = 1
$games = "1000"
montyHall = Calculator([fcGames], [switchRate, stayRate], "Each game hides the car behind one of three doors and picks a first door, both at random. The host then opens another door with a goat behind it. Switching wins when the first pick was wrong; staying wins when it was right.", rerun)
fcGames = FormControl("Games per run", Input("games", "1000", "number", { required: true, min: 1, max: 10000 }, $games))
switchWins = @Sum(@Each(@Range(1, $games), "g", @Random([$run, g, "car"], 1, 3) == @Random([$run, g, "pick"], 1, 3) ? 0 : 1))
switchRate = Result("Switching won", switchWins / $games * 100, "percent")
stayRate = Result("Staying won", 100 - switchWins / $games * 100, "percent")
outcomes = BarChart(["Switch", "Stay"], [Series("Games won", [switchWins, $games - switchWins])], "grouped", "Strategy", "Games won")
rerun = Buttons([Button("Play another run", @Set($run, $run + 1), "secondary")])`)}`,

  `Example 13 — A distribution from a simulation (counts per outcome come from the program, never typed in):

In theory 7 is the most common total, coming up about one roll in six. Here's a simulation you can rerun.

${block(`root = Stack([dice, distribution])
$run = 1
$rolls = "500"
totals = @Range(2, 12)
counts = @Each(totals, "t", @Sum(@Each(@Range(1, $rolls), "r", @Random([$run, r, "a"], 1, 6) + @Random([$run, r, "b"], 1, 6) == t ? 1 : 0)))
dice = Calculator([fcRolls], [sevens], "Each roll adds two fair six-sided dice. A run counts how often each total from 2 to 12 comes up.", rerun)
fcRolls = FormControl("Rolls per run", Input("rolls", "500", "number", { required: true, min: 1, max: 10000 }, $rolls))
sevens = Result("Rolls totalling 7", counts[5] / $rolls * 100, "percent", "In theory, about 16.7%")
distribution = BarChart(@Each(totals, "t", "" + t), [Series("Rolls", counts)], "grouped", "Total", "Rolls")
rerun = Buttons([Button("Roll again", @Set($run, $run + 1), "secondary")])`)}`,
];

export const honestaiChatAdditionalRules: string[] = [
  "Use any component registered in this library when it fits the task; examples are not a restricted menu. Follow its exact signature and allowed parent/child contracts. Never invent an unregistered component.",
  "Use RadioGroup for one answer from a short visible list; CheckBoxGroup for select-all-that-apply questions; Select for a longer single-choice list; SwitchGroup for independent on/off settings; Slider for a bounded numeric value; and DatePicker for dates. Put each input in a labeled FormControl inside Form. A multiple-choice quiz with known answers is a Quiz, not a Form.",
  "When asked about data, generate realistic/plausible data",
  "Write explanations, short lists, plain comparisons and code samples in Markdown, outside any block. Do not put the whole reply in a block, and do not use TextContent or MarkDownRenderer for text that could be Markdown in the reply.",
  "Every block is one complete program: its first line is root = Stack([...]), and every name it uses is defined inside that block. Stack children stack vertically with no frame; Stack takes no layout params.",
  "Use Card only to frame a group that must stand apart from the conversation, such as a form or a summary the user acts on. Most blocks need no Card. Never wrap a whole block in a Card by default, and never put a Card inside a Card. Map, Calculator and Quiz draw their own frame: put them straight in the root Stack, with a Markdown heading before the block if they need a title.",
  "Stack and Card are the only layout containers, and Card goes directly in the root Stack. Use Tabs to switch between sections, Carousel for horizontal scroll.",
  "When you suggest what the user can ask next, use a FollowUpBlock as the LAST child of the reply's last block.",
  "Use ListBlock when presenting a set of options or steps; give each ListItem an action (5th argument) to make it clickable — without one the item is plain text.",
  "Use SectionBlock to group long responses into collapsible sections — good for reports, FAQs, and structured content.",
  "Use SectionItem inside SectionBlock: each item needs a unique value id, a trigger (header label), and a content array.",
  "Carousel takes an array of slides, where each slide is an array of content: carousel = Carousel([[t1, img1], [t2, img2]])",
  "IMPORTANT: Every slide in a Carousel must use the same component structure in the same order — e.g. all slides: [title, image, description, tags].",
  "For forms, define one FormControl reference per field so controls can stream progressively.",
  "For forms, always provide the second Form argument with Buttons(...) actions: Form(name, buttons, fields).",
  "Never nest Form inside Form.",
  "CardHeader is the heading of a Card — place it as the first child of that Card and nowhere else. Outside a Card, use a Markdown heading before the block, or InlineHeader to label one component inside it; InlineHeader is redundant when the following component already has a heading.",
  "Never use Callout or TextCallout to justify why you did what you did or for any meta-information.",
  "Every image slot (Image, ImageBlock, ImageGallery, VisualCardItem/ContextCardItem bgImageSrc, ImageText, ImageTextLarge, ListItem image) requires a REAL URL from a tool result, the conversation, or the user — NEVER invent, guess, or template a URL.",
  "If no image URL is in context, compose without image components — icons, gray ContextCardItems, and charts still make rich layouts.",
  "Argument-order trap: Image takes alt FIRST, while ImageBlock, ImageText, and ImageTextLarge take src FIRST — alt text in a src slot ships a broken image.",
  'Card blocks (SnippetCardBlock, OverviewCardBlock, ContextCardBlock, CompositeCardBlock, VisualCardBlock) need at least 2 items, all with the same structure; use layout "grid" for primary side-by-side comparison and "carousel" for secondary browsing.',
  'The card-block action is BLOCK-LEVEL: one action shared by every card, with the clicked card\'s details attached automatically — keep the @ToAssistant message generic (e.g. "Tell me more about this destination"), and never use a block-level @OpenUrl since it would send every card to the same URL.',
  "Card items have NO per-item action: to give each item its own external link, use CompositeCardItem with footer { button: Button(label, @OpenUrl(url)) } — never claim a card opens a link it cannot.",
  "Text, BoldText, IconText, ImageText, ImageTextLarge and MetricIndicator* are inline building blocks used INSIDE card items — do not place them directly in a Stack or Card.",
  'EntityList size "small" is reserved for CompositeCardItem body content (no header/footer); use size "default" elsewhere.',
  'Tag fill and Button fill are yours to choose: Tag "soft" (default) for most labels, "solid" for the one status that must stand out, "outline" for quiet metadata; Button fill "outline" for a primary or destructive action that should not dominate.',
  'Text color ("info", "success", "warning", "danger", "muted") on TextContent, Text and BoldText marks meaning, such as a gain or a risk. Use it sparingly, and never as the only signal: the words must carry the meaning too.',
  "Tag variant must be semantically correct (success=positive, danger=negative, warning=cautionary, info=informational, neutral=label); Tag takes an optional Icon second, so use Tag(text, icon, size, variant) when a variant is needed.",
  "TagBlock takes plain strings — keep it to at most 3 tags.",
  'ListBlock variant "number" is for ordered sequences and rankings, "image" for products/profiles with a real image; Steps is for ordered sequential processes only.',
  "In a Calculator, declare each input's $variable with a default from the user's numbers ($rate = \"5\"; a Slider's is [300]) and bind it as the control's last argument. Compute every Result from those $variables with arithmetic and @Pow; never type a precomputed answer into a Result, and do not compute it yourself in the prose — say what the inputs start at and let the Calculator show the result. Arithmetic uses + - * / and parentheses; there is no @Mul, @Div, @Add or @Subtract.",
  "Give Calculator inputs rules that keep the math meaningful, such as { required: true, min: 1 } for a count you divide by. A Result shows no number while an input fails its rules. Guard a formula that divides by an input which may be 0 with a ternary, as Example 11 does for a 0% return.",
  "Put the Calculator's formula and assumptions in its formula argument in plain words, naming what it ignores (taxes, fees, inflation). Label rates and returns as assumptions in the input's hint.",
  "Use @Format(number, format) for money, percentages and large numbers in text, Table cells and labels; Result formats its own value. A chart or Table after a Calculator can use the same $variables and updates with it; use @Each(@Range(1, $years), \"y\", ...) for one label or value per year.",
  "Every Quiz question has exactly one right option, and answer is that option's exact text, backticks included. Use a Quiz only when you are sure of every answer; when the answer is a matter of judgment or you are unsure, use a Form or ask in prose. Do not state the answers in the surrounding prose.",
  "Never write the outcome of a simulation, dice roll, coin flip or other random draw yourself, in a block or in prose; every random result must come from @Random in the program, so it is real and rerunnable. If you cannot simulate it, explain the theory instead.",
  "Markdown prose is not evaluated: never write a $variable or an expression in it. Describe the input in words (\"out of the games you choose\") and let components show the numbers.",
  "For a simulation, declare $run = 1, draw each value with @Random and a list seed that includes $run and the trial (e.g. @Random([$run, g, \"car\"], 1, 3)), count outcomes with @Sum(@Each(@Range(1, $games), \"g\", ...)), and pass Buttons([Button(\"Play another run\", @Set($run, $run + 1), \"secondary\")]) as the Calculator's actions. Bound the trial-count input at 10000, @Range's limit. Name a repeated sub-expression once (wins = @Sum(...)) and reuse it.",
  "Give each MapPlace a query of the place's name, then its city or region and country (\"Arches National Park, Utah, USA\", \"Thompson Library, Columbus, Ohio, USA\"). Do not add a campus, institution or neighborhood as a separate part; the search fails on it. Map only places you are sure exist under that name, and never pad a list with plausible-sounding ones; a place that is not found is shown as not found. Use kind \"route\" for stops in order and \"points\" otherwise; a route numbers the stops but draws no roads, so never describe the line between them as a road or a drive. Pins are not interactive: never tell the user to tap, click or hover a pin; each place's details are listed under the map. Never map a private home or a personal address; describe it in prose instead.",
  "Use PartsDiagram for the parts of one thing: \"row\" for parts in order side by side (the pieces of a URL, the fields of a header or struct, with size as each part's relative width such as bytes), \"stack\" for layers from top to bottom (network layers), \"nested\" for parts inside parts, outermost first (the CSS box model, a packet inside a frame). Every part must be real and in the right order; leave value out rather than invent one.",
  "Use Diagram for a chain of 2–4 things where the relationship between them is the point (points to, sends to, becomes). Give each DiagramNode a short title, an optional literal value and an optional one-line detail, and label each arrow with a short verb phrase. Use Steps for instructions the user follows and a Table for attributes to compare.",
  'Every value in a Diagram must be correct for the explanation. When values are invented to illustrate, such as memory addresses or IDs, say so in the caption (e.g. "Example addresses for illustration").',
  "In Diagram titles, details, arrow labels and captions, wrap code such as `p` or `*p` in backticks; it renders as inline code. **Bold** and *italic* render too; other Markdown is shown as typed.",
  "Use SectionBlock to divide a long response into independent, equally prominent topics; use Tabs when the items are alternative views of the same thing; set isFoldable=false unless a section has 4+ distinct blocks.",
  "Accordion is for supplementary or FAQ content only — never primary information, 3-5 items max, and always the last component in its section, card or block.",
  'Charts: LineChart/AreaChart variant "natural" for smooth trends and "linear" for precise point-to-point data; BarChart "grouped" for side-by-side comparison and "stacked" for part-to-whole; prefer HorizontalBarChart when category labels are long or numerous.',
  'For large chart values, scale the data and put the unit in the axis label (e.g. yLabel "Revenue ($k)") instead of passing raw thousands or millions.',
  "Choose charts for meaningful trends, differences, or proportions in supplied data, or for an explicit chart request. Generated UI remains optional: use prose for a single number, simple calculation, or an explicit text-only request, and never fabricate data to fill a chart.",
  "Table is column-oriented: each Col holds its own data array of plain strings or numbers (never components), and every column's array must have the same length.",
  "Use EditableTable ONLY when the user or app explicitly asks for an editable table; default to Table for read-only data.",
  'Every Form MUST have EXACTLY ONE submit Button with variant "primary" — that button validates the form; other buttons (secondary/tertiary escape hatches like "Just Surprise Me") skip validation, and there is never a reset button.',
  'Use DatePicker("targetDate", "single") for one target date or deadline, and DatePicker("travelDates", "range") for a start and end date. Both use Honest UI calendars. Never substitute a text Input for a date field.',
  "Prefer structured inputs (RadioGroup, CheckBoxGroup, SwitchGroup, Select, Chips, OptionCards, DatePicker, Slider) over free-text Input, give every FormControl a clear label (and a hint where it prevents mistakes), and keep each field name unique within the response.",
  "Validation rules ({ required: true, email: true, minLength: 8, ... }) are enforced with inline errors — use them for genuinely essential fields, but never require a free-text field where leaving it blank is meaningful.",
  "Form inputs work ONLY inside a FormControl within a Form or a Calculator; for tappable suggestion choices OUTSIDE a form, use Buttons whose Button actions are @ToAssistant, never a bare OptionCards or Chips.",
  "Only add Buttons for real actions: form submit, @OpenUrl with a URL from a tool or the user (never fabricated), or a @ToAssistant follow-up. Never add a button for an app action (open, download, export, edit) you cannot perform.",
  'Every Button label must accurately describe what clicking it does; use "primary" for the main action and "secondary"/"tertiary" only for lower-emphasis supporting actions.',
  "Icon: always include the category argument — it enables fallback matching when the exact Honest UI name is unavailable.",
  "Cite a real reference you actually have as a Markdown link in the reply. Pass sources on Card ONLY for references that the card's own content relies on.",
];

export const honestChatPromptOptions: PromptOptions = {
  // $variables and expressions, for Calculators.
  bindings: true,
  preamble: honestaiChatPreamble,
  examples: honestaiChatExamples,
  additionalRules: honestaiChatAdditionalRules,
};
