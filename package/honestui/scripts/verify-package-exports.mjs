import assert from "node:assert/strict"

const [icons, logos, vectors, charts, shaders] = await Promise.all([
  import("honestui/icons"),
  import("honestui/logos"),
  import("honestui/vectors"),
  import("honestui/charts"),
  import("honestui/shaders"),
])

assert.ok(icons.Search, "honestui/icons must export Search")
assert.ok(logos.Vercel, "honestui/logos must export Vercel")
assert.ok(vectors.Abstract1Shapes, "honestui/vectors must export Abstract1Shapes")
assert.ok(charts.BarChart, "honestui/charts must export BarChart")
assert.ok(shaders.LightRays, "honestui/shaders must export LightRays")
assert.deepEqual(Object.keys(shaders).sort(), [
  "GradientBlinds",
  "Grainient",
  "LightRays",
])
