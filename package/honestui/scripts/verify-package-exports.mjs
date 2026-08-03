import assert from "node:assert/strict"

const [icons, charts, shaders] = await Promise.all([
  import("honestui/icons"),
  import("honestui/charts"),
  import("honestui/shaders"),
])

assert.ok(icons.Search, "honestui/icons must export Search")
assert.ok(charts.BarChart, "honestui/charts must export BarChart")
assert.ok(shaders.LightRays, "honestui/shaders must export LightRays")
assert.deepEqual(Object.keys(shaders).sort(), [
  "Dither",
  "GradientBlinds",
  "Grainient",
  "GridDistortion",
  "LightRays",
])
