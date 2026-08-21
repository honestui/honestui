import type { Metadata } from "next"

import {
  ContentSection,
  PublicContentLayout,
} from "@/components/public-content-layout"

const linkClass =
  "rounded-[var(--hui-radius-1)] underline underline-offset-4 outline-none focus-visible:[outline:var(--hui-focus-ring)]"

export const metadata: Metadata = {
  title: "Contact Honest UI",
  description:
    "Contact Honest UI about bugs, documentation, contributions, package questions, or security vulnerabilities.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return (
    <PublicContentLayout
      description="Use the public repository for product, package, and documentation questions. Security vulnerabilities have a separate private reporting path."
      eyebrow="Support and reporting"
      title="Contact Honest UI"
    >
      <ContentSection id="contact-public" title="Bugs, documentation, and questions">
        <p>
          Search the existing GitHub issues before opening a new report. If the problem has not been reported, <a className={linkClass} href="https://github.com/honestui/honestui/issues/new">open a GitHub issue</a> with the affected Honest UI version, your React and Node.js versions, the command or component involved, reproduction steps, and the result you expected. A small repository or code example is useful when the failure depends on project configuration.
        </p>
        <p>
          GitHub issues are public. Do not include access tokens, private repository content, personal data, customer information, unpublished source, or security-sensitive details. Remove secrets from logs and screenshots before attaching them.
        </p>
      </ContentSection>

      <ContentSection id="contact-security" title="Report a security vulnerability privately">
        <p>
          Do not report a suspected vulnerability in a public issue, discussion, or pull request. Use <a className={linkClass} href="https://github.com/honestui/honestui/security/advisories/new">GitHub private vulnerability reporting</a>. Include a clear description, affected versions, reproduction steps or a proof of concept, and the impact you believe the vulnerability has. The project security policy explains the supported version and disclosure process.
        </p>
      </ContentSection>

      <ContentSection id="contact-contributions" title="Propose a contribution">
        <p>
          Small bug fixes and documentation improvements can go directly to a pull request. Open an issue before beginning a large change or new component so the approach can be discussed first. The <a className={linkClass} href="https://github.com/honestui/honestui/blob/main/CONTRIBUTING.md">contribution guide</a> lists the local setup, required checks, accessibility expectations, and the information to include with a pull request.
        </p>
      </ContentSection>
    </PublicContentLayout>
  )
}
