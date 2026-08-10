import { createServer, type Server } from "node:http"

type RegistryItem = {
  name: string
  [key: string]: unknown
}

export async function createRegistryServer(
  items: RegistryItem[],
  options: { port?: number } = {}
) {
  const port = options.port ?? 4447
  let server: Server | undefined

  return {
    async start() {
      if (server) return

      server = createServer((request, response) => {
        const url = new URL(request.url ?? "/", `http://localhost:${port}`)
        const match = url.pathname.match(/^\/r\/(.+)\.json$/)
        const itemName = match ? decodeURIComponent(match[1]) : undefined
        const item = items.find((candidate) => candidate.name === itemName)

        response.setHeader("Content-Type", "application/json")
        if (!item) {
          response.statusCode = 404
          response.end(JSON.stringify({ message: "Registry item not found" }))
          return
        }

        response.statusCode = 200
        response.end(JSON.stringify(item))
      })

      await new Promise<void>((resolve, reject) => {
        server!.once("error", reject)
        server!.listen(port, "127.0.0.1", () => {
          server!.off("error", reject)
          resolve()
        })
      })
    },

    async stop() {
      if (!server) return
      const activeServer = server
      server = undefined
      await new Promise<void>((resolve, reject) => {
        activeServer.close((error) => (error ? reject(error) : resolve()))
      })
    },
  }
}
