"use client"

import * as React from "react"

import {
  SecretList,
  SecretRow,
  type SecretRowSecret,
} from "@/registry/default/product/secret-row/secret-row"

const now = Date.parse("2026-11-26T15:00:00Z")
const day = 24 * 60 * 60 * 1000

/**
 * Keys the page can only describe: the server never returns their values,
 * so there is no Show or Copy. Rotation fails the first time it is tried.
 */
const sampleKeys: SecretRowSecret[] = [
  {
    id: "whsec_billing",
    name: "Billing webhook",
    prefix: "whsec_",
    last4: "8b1c",
    createdAt: now - 380 * day,
    lastUsedAt: now - 12 * day,
    scopes: ["invoice.paid", "invoice.failed"],
  },
  {
    id: "key_legacy",
    name: "Legacy importer",
    prefix: "hk_live_",
    last4: "a4e0",
    createdAt: now - 720 * day,
    lastUsedAt: now - 95 * day,
    expiresAt: now - 4 * day,
  },
  {
    id: "key_contractor",
    name: "Contractor access",
    prefix: "hk_live_",
    last4: "5d77",
    createdAt: now - 160 * day,
    lastUsedAt: now - 60 * day,
    status: "revoked",
  },
]

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export default function SecretRowStates() {
  const attempts = React.useRef(0)

  return (
    <SecretList aria-label="Webhook and legacy keys" className="max-w-xl">
      {sampleKeys.map((key) => (
        <SecretRow
          key={key.id}
          secret={key}
          now={now}
          onRotate={async (secret) => {
            await wait(800)
            attempts.current += 1
            if (attempts.current === 1) throw new Error("Rotation failed")
            return { value: `${secret.prefix ?? ""}Qm7Tz2LpX9cV4nB8wR1yK6hD3sF0` }
          }}
        />
      ))}
    </SecretList>
  )
}
