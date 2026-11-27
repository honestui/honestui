"use client"

import * as React from "react"

import {
  SecretList,
  SecretRow,
  type SecretRowSecret,
} from "@/registry/default/product/secret-row/secret-row"

// A fixed clock, so the relative times read the same on every visit.
const now = Date.parse("2026-11-26T15:00:00Z")
const hour = 60 * 60 * 1000
const day = 24 * hour

const sampleKeys: SecretRowSecret[] = [
  {
    id: "key_prod",
    name: "Production server",
    prefix: "hk_live_",
    last4: "3f9a",
    createdAt: now - 214 * day,
    lastUsedAt: now - 2 * 60 * 1000,
    scopes: ["orders:read", "orders:write", "refunds:write"],
  },
  {
    id: "key_ci",
    name: "CI pipeline",
    prefix: "hk_live_",
    last4: "c07e",
    createdAt: now - 41 * day,
    lastUsedAt: now - 5 * hour,
    expiresAt: now + 49 * day,
    scopes: ["orders:read"],
  },
  {
    id: "key_local",
    name: "Local development",
    prefix: "hk_test_",
    last4: "91d2",
    createdAt: now - 3 * day,
    lastUsedAt: null,
    scopes: ["orders:read", "customers:read"],
  },
]

/** Stand-in for the server: values are made up here and only handed over on request. */
const values: Record<string, string> = {
  key_prod: "hk_live_4eC39HqLyjWDarjtT1zdp7dc3f9a",
  key_ci: "hk_live_9vNq2RkPz7uYbXm3TgLs0hWfc07e",
  key_local: "hk_test_Fh2kLp9QzRm4WnYt7Vb1xJe891d2",
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function randomTail(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789"
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")
}

export default function SecretRowDemo() {
  return (
    <SecretList aria-label="API keys" className="max-w-xl">
      {sampleKeys.map((key) => (
        <SecretRow
          key={key.id}
          secret={key}
          now={now}
          onReveal={async (secret) => {
            await wait(350)
            return values[secret.id] ?? ""
          }}
          onRotate={async (secret) => {
            await wait(900)
            const value = `${secret.prefix ?? ""}${randomTail(28)}`
            values[secret.id] = value
            return { value }
          }}
          onRevoke={() => wait(700)}
        />
      ))}
    </SecretList>
  )
}
