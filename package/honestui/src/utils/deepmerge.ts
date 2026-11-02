import createDeepmerge from "@fastify/deepmerge"

export const deepmerge = createDeepmerge({ symbols: true })

export const mergeWithArrayReplacement = createDeepmerge({
  symbols: true,
  mergeArray: ({ clone }) => (_target, source) => clone(source),
})
