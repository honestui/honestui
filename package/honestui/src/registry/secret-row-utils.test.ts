import { describe, expect, it } from "vitest"

import {
  defaultSecretRowLabels,
  formatRelativeTime,
  getSecretStatus,
  maskSecret,
} from "../../registry/default/product/secret-row/secret-row-utils"

const now = Date.parse("2026-11-26T15:00:00Z")
const minute = 60 * 1000
const day = 24 * 60 * minute

describe("maskSecret", () => {
  it("keeps the prefix and last four characters around a fixed run of bullets", () => {
    expect(maskSecret({ prefix: "hk_live_", last4: "3f9a" })).toBe("hk_live_••••••••••••3f9a")
  })

  it("takes the last four characters from the full value when last4 is missing", () => {
    expect(maskSecret({ prefix: "sk_", value: "sk_abcdefgh1234" })).toBe("sk_••••••••••••1234")
  })

  it("does not follow the length of the real value", () => {
    const short = maskSecret({ value: "abcd1234" })
    const long = maskSecret({ value: "abcdefghijklmnopqrstuvwxyz1234" })
    expect(short.length).toBe(long.length)
  })

  it("accepts another mask length and never a negative one", () => {
    expect(maskSecret({ last4: "9999" }, 4)).toBe("••••9999")
    expect(maskSecret({ last4: "9999" }, -2)).toBe("9999")
  })
})

describe("formatRelativeTime", () => {
  it("writes past and future times in words", () => {
    expect(formatRelativeTime(now - 2 * minute, now, "en")).toBe("2 minutes ago")
    expect(formatRelativeTime(now - day, now, "en")).toBe("yesterday")
    expect(formatRelativeTime(now + 3 * day, now, "en")).toBe("in 3 days")
  })

  it("calls anything under a minute now", () => {
    expect(formatRelativeTime(now - 10 * 1000, now, "en")).toBe("now")
  })

  it("accepts dates, strings, and numbers", () => {
    const iso = new Date(now - 5 * 60 * minute).toISOString()
    expect(formatRelativeTime(iso, new Date(now), "en")).toBe("5 hours ago")
  })
})

describe("getSecretStatus", () => {
  it("is active by default", () => {
    expect(getSecretStatus({}, now)).toBe("active")
  })

  it("keeps revoked and expired as given", () => {
    expect(getSecretStatus({ status: "revoked" }, now)).toBe("revoked")
    expect(getSecretStatus({ status: "expired" }, now)).toBe("expired")
  })

  it("treats a key past its expiry as expired even when the server says active", () => {
    expect(getSecretStatus({ status: "active", expiresAt: now - 1 }, now)).toBe("expired")
    expect(getSecretStatus({ status: "active", expiresAt: now + day }, now)).toBe("active")
  })

  it("lets a revocation win over an expiry", () => {
    expect(getSecretStatus({ status: "revoked", expiresAt: now - day }, now)).toBe("revoked")
  })
})

describe("labels", () => {
  it("names every button after its key", () => {
    expect(defaultSecretRowLabels.copy("CI pipeline")).toBe("Copy CI pipeline")
    expect(defaultSecretRowLabels.revoke("CI pipeline")).toBe("Revoke CI pipeline")
  })
})
