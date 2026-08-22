import type { Metadata } from "next"

import {
  ContentSection,
  PublicContentLayout,
} from "@/components/public-content-layout"

export const metadata: Metadata = {
  title: "About Honest UI",
  description:
    "Learn who maintains Honest UI, what the project publishes, and how its source-first ownership model works.",
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return (
    <PublicContentLayout
      centerFooterLinks
      description="Honest UI is an MIT-licensed React component project created and maintained by Connor Love. It publishes editable application components alongside package-based charts, icons, logos, vectors, and shaders."
      title="About Honest UI"
    >
      <ContentSection id="about-purpose" title="Why Honest UI exists">
        <p>
          Honest UI is built for teams that want clear ownership of interface code. UI and animated components are distributed through a command-line tool that copies source files into your project. Once copied, those files are application code: you can inspect, change, rename, test, or remove them. The documentation does not treat a component library as a substitute for product decisions or claim that a copied component makes every final composition accessible by default.
        </p>
      </ContentSection>

      <ContentSection id="about-scope" title="What the project publishes">
        <p>
          The project includes React UI components, animated interactions, chart components, icon and logo catalogs, vectors, and shader effects. Delivery differs by collection. Components that are meant to be owned and adapted are copied into the consuming repository. Collections that benefit from a maintained runtime or large generated catalog stay in the published <code>honestui</code> package and use documented entry points.
        </p>
      </ContentSection>

      <ContentSection id="about-maintenance" title="Maintenance and accountability">
        <p>
          Connor Love is identified as the project creator and maintainer in the site metadata and public repository. Changes, release history, contribution guidance, licensing, and the security policy are kept with the source on GitHub. Bugs and documentation problems can be reported publicly; suspected vulnerabilities use GitHub&apos;s private vulnerability-reporting flow so sensitive details are not exposed in an issue.
        </p>
        <p>
          Honest UI is open source and does not publish a paid support promise, response-time guarantee, certification, or warranty. The repository, documentation, package metadata, and deployed machine-readable files are the sources of truth for the capabilities that currently exist.
        </p>
      </ContentSection>
    </PublicContentLayout>
  )
}
