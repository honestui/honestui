"use client"

import { useEffect, useState } from "react"
import { Check, Copy } from "honestui/icons"

import styles from "@/components/landing-showcase.module.css"

const INSTALL_COMMAND = "npx honestui@latest init"
const COPIED_FEEDBACK_MS = 2000

export function LandingInstallCommand({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    return () => window.clearTimeout(timeout)
  }, [copied])

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND)
      setCopied(true)
    } catch {
      // Clipboard access can be denied; the command stays selectable as text.
    }
  }

  return (
    <div className={[styles.command, className].filter(Boolean).join(" ")}>
      <span aria-hidden="true" className={styles.commandPrompt}>
        $
      </span>
      <code>{INSTALL_COMMAND}</code>
      <button
        aria-label="Copy install command"
        className={styles.commandCopy}
        onClick={copyCommand}
        type="button"
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </button>
      <span className="sr-only" role="status">
        {copied ? "Copied" : ""}
      </span>
    </div>
  )
}
