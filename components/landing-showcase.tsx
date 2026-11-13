import Link from "next/link"
import {
  ArrowRight,
  Copy,
  CreditCard,
  Heart,
  Package,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
} from "honestui/icons"

import { GithubIcon } from "@/assets/icons"
import { LandingAccountTabs } from "@/components/landing-account-tabs"
import {
  LandingChartCard,
  LandingShaderCard,
  LandingTickerCard,
} from "@/components/landing-collection-previews"
import { LandingInstallCommand } from "@/components/landing-install-command"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { HONEST_AI_TAGLINE, HONEST_AI_URL } from "@/globals/constants/site"
import styles from "@/components/landing-showcase.module.css"
import { Assembly } from "@/components/landing/assembly"
import { CollectionsBento, VelocityMarquee } from "@/components/landing/collections"
import { InstallPlayground } from "@/components/landing/install-playground"
import landing from "@/components/landing/landing.module.css"
import { RethemeConsole } from "@/components/landing/retheme-console"
import {
  getAssemblySteps,
  getComponentNames,
  getInstallItems,
} from "@/components/landing/sources"
import { SplitReveal } from "@/components/landing/split-reveal"
import { VariableProximity } from "@/components/landing/variable-proximity"
import { XrayProvider, XrayStage, XrayToggle } from "@/components/landing/xray-stage"

// Counted from the honestui/icons index (each style variant is its own export).
const ICON_COUNT = "4,084"

const previewCardClass = styles.previewCard

const previewLabelClass =
  "text-sm font-medium text-[var(--hui-color-foreground-base-primary)]"

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function previewButtonClass({
  className,
  size,
  variant = "default",
}: {
  className?: string
  size?: "default" | "icon" | "large"
  variant?: "default" | "outline"
}) {
  return cx(
    styles.button,
    variant === "default" ? styles.buttonDefault : styles.buttonOutline,
    size === "large" && styles.buttonLarge,
    size === "icon" && styles.buttonIcon,
    className,
  )
}

function PreviewButton({
  className,
  fullWidth = false,
  size = "default",
  variant = "default",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean
  size?: "default" | "icon" | "large"
  variant?: "default" | "outline"
}) {
  return (
    <button
      {...props}
      className={cx(
        previewButtonClass({ className, size, variant }),
        fullWidth && styles.buttonFull,
      )}
      type={type}
    />
  )
}

function PreviewBadge({
  children,
  size = "default",
  variant = "secondary",
}: {
  children: React.ReactNode
  size?: "default" | "small"
  variant?: "accent" | "secondary" | "success"
}) {
  return (
    <span
      className={cx(
        styles.badge,
        size === "small" && styles.badgeSmall,
        variant === "accent" && styles.badgeAccent,
        variant === "secondary" && styles.badgeSecondary,
        variant === "success" && styles.badgeSuccess,
      )}
    >
      {children}
    </span>
  )
}

function PreviewField({
  id,
  label,
  type = "text",
  placeholder,
}: {
  id: string
  label: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <span className={styles.inputControl} data-xray-field="">
        <input
          className={styles.input}
          id={id}
          type={type}
          placeholder={placeholder}
        />
      </span>
    </div>
  )
}

function SignUpCard({ xray = false }: { xray?: boolean }) {
  const id = (value: string) => (xray ? `xray-${value}` : value)
  return (
    <Card className={previewCardClass} data-xray="<Card> · auth flow">
      <CardHeader>
        <CardTitle>
          <h3>Sign up</h3>
        </CardTitle>
        <CardDescription>
          Create an account to start your first workspace.
        </CardDescription>
      </CardHeader>
      <CardPanel className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <PreviewButton fullWidth variant="outline">
            <span aria-hidden="true" className="font-semibold">G</span>
            Google
          </PreviewButton>
          <PreviewButton fullWidth variant="outline">
            <GithubIcon aria-hidden="true" />
            GitHub
          </PreviewButton>
        </div>
        <p className="text-center text-xs text-[var(--hui-color-foreground-base-secondary)]">
          or continue with email
        </p>
        <PreviewField
          id={id("signup-email")}
          label="Email"
          type="email"
          placeholder="you@example.com"
        />
        <PreviewField
          id={id("signup-password")}
          label="Password"
          type="password"
          placeholder="Enter your password"
        />
      </CardPanel>
      <CardFooter>
        <PreviewButton fullWidth>Create account</PreviewButton>
      </CardFooter>
    </Card>
  )
}

const notificationOptions = [
  {
    label: "Component updates",
    description: "Changes to components already in your project.",
    checked: true,
  },
  {
    label: "New collections",
    description: "New charts, icons and visual tools.",
    checked: true,
  },
  {
    label: "Release notes",
    description: "A concise summary for every release.",
    checked: false,
  },
]

function NotificationsCard() {
  return (
    <Card className={previewCardClass} data-xray="<Card> · 3 × role=switch">
      <CardHeader>
        <CardTitle>
          <h3>Notifications</h3>
        </CardTitle>
        <CardDescription>Choose which product updates reach you.</CardDescription>
      </CardHeader>
      <CardPanel className="space-y-5">
        {notificationOptions.map((option) => (
          <div key={option.label} className="flex items-start justify-between gap-5">
            <div className="space-y-1">
              <p className={previewLabelClass}>{option.label}</p>
              <p className="text-sm leading-5 text-[var(--hui-color-foreground-base-secondary)]">
                {option.description}
              </p>
            </div>
            <input
              aria-label={option.label}
              defaultChecked={option.checked}
              className={styles.switch}
              role="switch"
              type="checkbox"
            />
          </div>
        ))}
      </CardPanel>
      <CardFooter>
        <PreviewButton fullWidth variant="outline">
          Save preferences
        </PreviewButton>
      </CardFooter>
    </Card>
  )
}

function PaymentCard({ xray = false }: { xray?: boolean }) {
  const id = (value: string) => (xray ? `xray-${value}` : value)
  return (
    <Card className={previewCardClass} data-xray="<Card> · aria-pressed group">
      <CardHeader>
        <CardTitle>
          <h3>Payment method</h3>
        </CardTitle>
        <CardDescription>Add a card or account for future payments.</CardDescription>
      </CardHeader>
      <CardPanel className="space-y-4">
        <div className="grid grid-cols-3 gap-3" role="group" aria-label="Payment type">
          {[
            { label: "Card", icon: CreditCard },
            { label: "PayPal", icon: Package },
            { label: "Wallet", icon: ShieldCheck },
          ].map(({ label, icon: Icon }, index) => (
            <button
              key={label}
              type="button"
              aria-pressed={index === 0}
              className={styles.paymentOption}
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </button>
          ))}
        </div>
        <PreviewField id={id("payment-owner")} label="Cardholder" placeholder="Name on card" />
        <PreviewField id={id("payment-number")} label="Card number" placeholder="0000 0000 0000 0000" />
        <div className="grid grid-cols-3 gap-3">
          <PreviewField id={id("payment-month")} label="Month" placeholder="MM" />
          <PreviewField id={id("payment-year")} label="Year" placeholder="YY" />
          <PreviewField id={id("payment-cvv")} label="CVV" placeholder="000" />
        </div>
      </CardPanel>
      <CardFooter>
        <PreviewButton fullWidth>Continue</PreviewButton>
      </CardFooter>
    </Card>
  )
}

function EcommerceCard() {
  const sizes = ["38", "39", "40", "41", "42", "43"]

  return (
    <Card className={previewCardClass} data-xray="<Card> · <fieldset> sizes">
      <CardHeader className="gap-3">
        <div className="w-fit">
          <PreviewBadge variant="success">In stock</PreviewBadge>
        </div>
        <CardTitle className="text-2xl">
          <h3>Studio sneakers</h3>
        </CardTitle>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xl font-medium">$79.99</p>
          <p className="flex items-center gap-1 text-sm text-[var(--hui-color-foreground-base-secondary)]">
            <Star aria-hidden="true" className="size-4 fill-current" /> 4.8
          </p>
        </div>
        <CardDescription>
          Lightweight canvas upper on a cushioned rubber sole.
        </CardDescription>
      </CardHeader>
      <CardPanel className="space-y-5">
        <fieldset className="space-y-3">
          <legend className={previewLabelClass}>Size</legend>
          <div className="grid grid-cols-6 gap-2">
            {sizes.map((size, index) => (
              <button
                key={size}
                type="button"
                aria-pressed={index === 2}
                className={styles.sizeOption}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="flex items-center gap-2 text-sm text-[var(--hui-color-foreground-base-secondary)]">
          <Ruler aria-hidden="true" className="size-4" /> View size guide
        </p>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <PreviewButton fullWidth>Add to cart</PreviewButton>
          <PreviewButton aria-label="Save item" size="icon" variant="outline">
            <Heart aria-hidden="true" />
          </PreviewButton>
        </div>
        <div className="space-y-3 rounded-[var(--hui-radius-3)] bg-[var(--hui-color-background-base-secondary)] p-4 text-sm">
          <p className="flex items-center gap-3"><ShoppingBag aria-hidden="true" className="size-4" /> Free shipping and returns</p>
          <p className="flex items-center gap-3"><ShieldCheck aria-hidden="true" className="size-4" /> Two-year extended warranty</p>
        </div>
      </CardPanel>
    </Card>
  )
}

function SharingCard({ xray = false }: { xray?: boolean }) {
  const id = (value: string) => (xray ? `xray-${value}` : value)
  const members = [
    { initials: "DT", label: "Design team", access: "Edit" },
    { initials: "FE", label: "Frontend team", access: "Edit" },
    { initials: "QA", label: "Quality team", access: "View" },
  ]

  return (
    <Card className={previewCardClass} data-xray="<Card> · read-only <Input>">
      <CardHeader>
        <CardTitle>
          <h3>Share document</h3>
        </CardTitle>
        <CardDescription>Invite collaborators and choose their access.</CardDescription>
      </CardHeader>
      <CardPanel className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={id("share-link")}>Document link</Label>
          <div className="flex gap-2">
            <span className={styles.inputControl}>
              <input
                className={styles.input}
                id={id("share-link")}
                readOnly
                value="https://honestui.com/docs"
              />
            </span>
            <PreviewButton aria-label="Copy document link" size="icon" variant="outline">
              <Copy aria-hidden="true" />
            </PreviewButton>
          </div>
        </div>
        <p className={previewLabelClass}>Members with access</p>
        <ul className="space-y-4">
          {members.map((member) => (
            <li key={member.label} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-[var(--hui-color-background-neutral-secondary)] text-xs font-medium">
                  {member.initials}
                </span>
                <span className="text-sm font-medium">{member.label}</span>
              </div>
              <PreviewBadge>{member.access}</PreviewBadge>
            </li>
          ))}
        </ul>
      </CardPanel>
    </Card>
  )
}

function IssueCard({ xray = false }: { xray?: boolean }) {
  const id = (value: string) => (xray ? `xray-${value}` : value)
  return (
    <Card className={previewCardClass} data-xray="<Card> · <form> fields">
      <CardHeader>
        <CardTitle>
          <h3>Report an issue</h3>
        </CardTitle>
        <CardDescription>Describe a problem clearly enough to reproduce it.</CardDescription>
      </CardHeader>
      <CardPanel className="space-y-4">
        <PreviewField id={id("issue-title")} label="Title" placeholder="A short, descriptive title" />
        <div className="space-y-2">
          <Label htmlFor={id("issue-framework")}>Framework</Label>
          <select
            id={id("issue-framework")}
            defaultValue="react"
            className="h-9 w-full rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-tertiary)] bg-[var(--hui-color-background-base-primary)] px-3 text-sm outline-none focus:border-[var(--hui-color-border-accent-emphasis)]"
          >
            <option value="react">React</option>
            <option value="next">Next.js</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("issue-description")}>Description</Label>
          <textarea
            className={styles.textarea}
            id={id("issue-description")}
            rows={4}
            placeholder="What happened, and what did you expect?"
          />
        </div>
      </CardPanel>
      <CardFooter className="justify-end gap-3">
        <PreviewButton variant="outline">Cancel</PreviewButton>
        <PreviewButton>Submit issue</PreviewButton>
      </CardFooter>
    </Card>
  )
}

const footerLinks = [
  { label: "Comparisons", href: "/compare" },
  { label: "Privacy", href: "/privacy" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

function LandingFooter({ className }: { className?: string }) {
  return (
    <p
      className={cx(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--hui-color-foreground-base-secondary)]",
        className,
      )}
    >
      <span>MIT licensed</span>
      {footerLinks.map((link) => (
        <Link
          key={link.href}
          className="rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:text-[var(--hui-color-foreground-base-primary)] hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
          href={link.href}
        >
          {link.label}
        </Link>
      ))}
    </p>
  )
}

function CardWall({ xray = false }: { xray?: boolean }) {
  return (
    <div className={landing.wall}>
      <div className="grid grid-cols-3 gap-7">
        <div className="flex flex-col gap-7">
          <LandingChartCard cardClassName={previewCardClass} xray={xray} />
          <SignUpCard xray={xray} />
          <NotificationsCard />
        </div>
        <div className="flex flex-col gap-7">
          <LandingShaderCard cardClassName={previewCardClass} xray={xray} />
          <LandingTickerCard cardClassName={previewCardClass} xray={xray} />
          <PaymentCard xray={xray} />
          <EcommerceCard />
        </div>
        <div className="flex flex-col gap-7">
          <SharingCard xray={xray} />
          <IssueCard xray={xray} />
          <LandingAccountTabs
            cardClassName={previewCardClass}
            idPrefix={xray ? "xray-" : ""}
          />
        </div>
      </div>
    </div>
  )
}

function SectionIntro({
  id,
  kicker,
  title,
  children,
}: {
  id: string
  kicker: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className={landing.intro}>
      <p className={landing.redline}>{kicker}</p>
      <SplitReveal as="h2" className={landing.sectionTitle} id={id} trigger="view" type="words">
        {title}
      </SplitReveal>
      {children ? <p className={landing.lede}>{children}</p> : null}
    </div>
  )
}

export async function LandingShowcase() {
  const [steps, installItems, componentNames] = await Promise.all([
    getAssemblySteps(),
    getInstallItems(),
    getComponentNames(),
  ])

  return (
    <main
      id="main-content"
      tabIndex={-1}
    >
      <XrayProvider>
      <div className={landing.hero}>
        <section className={landing.heroCopy}>
          <div className={landing.heroInner}>
            <a className={landing.newsLink} href={HONEST_AI_URL}>
              <span className={landing.newsLabel}>Honest AI</span>
              <span className="sr-only">: </span>
              <span>
                {HONEST_AI_TAGLINE.split(" ").slice(0, -1).join(" ")}{" "}
                <span className="whitespace-nowrap">
                  {HONEST_AI_TAGLINE.split(" ").at(-1)}
                  <ArrowRight aria-hidden="true" />
                </span>
              </span>
            </a>
            <h1 className={landing.heroTitle}>
              <span className="sr-only">Honest UI: </span>
              <SplitReveal className="block whitespace-nowrap" delay={0.1}>
                Good interfaces.
              </SplitReveal>{" "}
              <SplitReveal className="block whitespace-nowrap" delay={0.35}>
                Honest code.
              </SplitReveal>
            </h1>
            <p className={landing.heroLede}>
              Open-source React components with good defaults and no lock-in. Copy the source into your project, and import charts, icons and shaders only when you need them.
            </p>
            <div className={landing.heroActions}>
              <div className={landing.heroButtons}>
                <Link
                  className={previewButtonClass({ size: "large" })}
                  href="/docs/get-started"
                >
                  Get started
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link
                  className={previewButtonClass({
                    size: "large",
                    variant: "outline",
                  })}
                  href="/docs/component-guide"
                >
                  Browse components
                </Link>
              </div>
              <LandingInstallCommand />
            </div>
            <XrayToggle />
          </div>
        </section>

        <section aria-label="Honest UI component previews" className={landing.heroWall}>
          <h2 className="sr-only">Honest UI component previews</h2>
          <XrayStage live={<CardWall />} xray={<CardWall xray />} />
        </section>
      </div>
      </XrayProvider>

      <Assembly steps={steps} />

      <section aria-labelledby="install-title" className={landing.section}>
        <SectionIntro id="install-title" kicker="npx honestui add → components/ui" title="Take the source, not a dependency">
          Adding a component writes one file into your repository. The editor below opens the real source this site ships, so you can see exactly what you get.
        </SectionIntro>
        <InstallPlayground items={installItems} />
      </section>

      <section aria-labelledby="retheme-title" className={landing.section}>
        <SectionIntro id="retheme-title" kicker="data-accent-color · data-gray-color · --hui-radius-*" title="This page is built with Honest UI. Restyle it">
          Every surface on this page, including the hero above, reads the same tokens. Change one and the whole page follows, then copy the attributes into your app.
        </SectionIntro>
        <RethemeConsole />
      </section>

      <section aria-labelledby="collections-title" className={landing.sectionWide}>
        <div className={landing.sectionInner}>
          <SectionIntro id="collections-title" kicker="honestui/icons · honestui/charts · honestui/shaders" title="Charts, icons and shaders stay packages">
            These are too large to copy and paste, so they ship as maintained imports. Each has its own path, so the dependency stays visible in your code.
          </SectionIntro>
        </div>
        <VelocityMarquee items={componentNames} />
        <div className={landing.sectionInner}>
          <CollectionsBento iconCount={ICON_COUNT} />
        </div>
      </section>

      <section aria-labelledby="finale-title" className={landing.finale}>
        <h2 className="sr-only" id="finale-title">Start with Honest UI</h2>
        <VariableProximity className={landing.finaleWord} text="Honest UI" />
        <p className={landing.finaleLede}>
          Good defaults. The source in your repo. Nothing you can’t read.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link className={previewButtonClass({ size: "large" })} href="/docs/get-started">
            Get started
            <ArrowRight aria-hidden="true" />
          </Link>
          <a
            className={previewButtonClass({ size: "large", variant: "outline" })}
            href="https://github.com/honestui/honestui"
            rel="noreferrer"
            target="_blank"
          >
            <GithubIcon aria-hidden="true" />
            Star on GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <LandingInstallCommand className="mx-auto" />
        <LandingFooter className={landing.finaleFooter} />
      </section>

      <section
        aria-labelledby="honest-ui-ownership"
        className="sr-only focus-within:not-sr-only"
      >
        <div className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[var(--hui-color-foreground-accent-primary)]">
              Source-first by design
            </p>
            <h2
              className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl"
              id="honest-ui-ownership"
            >
              Own the interface you ship
            </h2>
            <p className="mt-5 text-lg leading-8 text-[var(--hui-color-foreground-base-secondary)]">
              Honest UI separates copied application code from package-backed tools so you can choose the right ownership model for each job. UI and animated components become source files in your repository. Charts, icons, logos, vectors, and shaders remain explicit package imports. The documentation identifies that boundary on every collection instead of treating installation as a single interchangeable step.
            </p>
            <p className="mt-5 leading-7 text-[var(--hui-color-foreground-base-secondary)]">
              Start with a component’s documented structure, states, and styling hooks, then adapt them to the language and constraints of your product. Honest UI supplies the implementation and its design tokens without claiming to know your validation rules, permissions, data, or content. That boundary keeps the starting point useful while leaving consequential product decisions in the application that owns them.
            </p>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <article>
              <h3 className="text-xl font-medium">Change copied components directly</h3>
              <p className="mt-3 leading-7 text-[var(--hui-color-foreground-base-secondary)]">
                Use the Honest UI CLI when you want component source inside your application. The CLI shows the files and dependencies it plans to add, supports a dry run, and leaves the result under your version control. You can rename the component, change its behavior, or remove it without waiting for a library release. Because the source becomes yours, your team also owns final accessibility, content, testing, and maintenance decisions.
              </p>
            </article>
            <article>
              <h3 className="text-xl font-medium">Import maintained collections</h3>
              <p className="mt-3 leading-7 text-[var(--hui-color-foreground-base-secondary)]">
                Use the published package for charts, icons, logos, vectors, and shaders when a maintained dependency is the better fit. Each collection has a dedicated import path, which keeps the dependency visible and avoids suggesting that generated assets or rendering systems were copied into your project. The guides document runtime dependencies, reduced-motion behavior, WebGL fallbacks, and the checks your application still needs to perform.
              </p>
            </article>
            <article>
              <h3 className="text-xl font-medium">Know what the defaults cover</h3>
              <p className="mt-3 leading-7 text-[var(--hui-color-foreground-base-secondary)]">
                Components use semantic foundations and share a coherent token system for color, type, spacing, radius, effects, and motion. Their final quality still depends on the context around them. Review real content, interaction states, keyboard behavior, focus order, contrast, reduced motion, responsive layout, and failure recovery in the application before treating a composition as complete.
              </p>
            </article>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              className={previewButtonClass({ size: "large" })}
              href="/docs/get-started"
            >
              Read the installation guide
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              className={previewButtonClass({
                size: "large",
                variant: "outline",
              })}
              href="/docs/accessibility"
            >
              Review accessibility guidance
            </Link>
          </div>
        </div>
        </div>
      </section>

      <section
        aria-labelledby="honest-ui-developer-resources"
        className="sr-only focus-within:not-sr-only"
      >
        <div className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[var(--hui-color-foreground-accent-primary)]">
              For developers and agents
            </p>
            <h2
              className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl"
              id="honest-ui-developer-resources"
            >
              <span className="sr-only">Honest UI </span>
              Developer Resources
            </h2>
            <p className="mt-5 text-lg leading-8 text-[var(--hui-color-foreground-base-secondary)]">
              Everything an integration needs is published at a stable URL and documented as machine-readable data. The REST API and MCP server are read-only and require no account or credential, so you can inspect the registry before writing any code.
            </p>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <article>
              <h3 className="text-xl font-medium">Honest UI REST API v1 and OpenAPI specification</h3>
              <p className="mt-3 leading-7 text-[var(--hui-color-foreground-base-secondary)]">
                The <Link className={styles.inlineLink} href="/api/v1">Honest UI REST API v1</Link> exposes the registry catalog, item index, individual items, base colors, and initialization presets as JSON with problem-details errors and versioned lifecycle headers. Generate a typed client from the <Link className={styles.inlineLink} href="/openapi.json">Honest UI OpenAPI 3.1 specification</Link>, which documents every operation ID, parameter description, response schema, error code, and the deprecation policy.
              </p>
              <p className="mt-3 leading-7 text-[var(--hui-color-foreground-base-secondary)]">
                Public GET endpoints: <code>/api/v1/registry</code> for the full catalog, <code>/api/v1/registry/index</code> for valid item names, <code>/api/v1/registry/&#123;name&#125;</code> for one item&rsquo;s source files, <code>/api/v1/colors/&#123;name&#125;</code> for a base color scale, and <code>/api/v1/init</code> for an initialization preset. Responses carry <code>X-Api-Version</code>, <code>RateLimit-Policy: 600;w=60</code> fair-use headers, and a Link to the deprecation policy. The API is versioned in the URL path; any future retirement is announced with RFC 9745 <code>Deprecation</code> and RFC 8594 <code>Sunset</code> headers at least 180 days in advance.
              </p>
            </article>
            <article>
              <h3 className="text-xl font-medium">Honest UI MCP server for AI agents</h3>
              <p className="mt-3 leading-7 text-[var(--hui-color-foreground-base-secondary)]">
                Connect an MCP client to the <Link className={styles.inlineLink} href="/mcp">Honest UI MCP server</Link> over Streamable HTTP to call typed, read-only tools: <code>list_registry_items</code> takes an optional case-insensitive <code>query</code> substring and returns valid component names with their registry types, and <code>get_registry_item</code> takes an exact returned name and retrieves that item&rsquo;s source files and dependencies. Call <code>list_registry_items</code> first whenever the name is unknown rather than guessing.
              </p>
              <p className="mt-3 leading-7 text-[var(--hui-color-foreground-base-secondary)]">
                Agents can discover the connection details without manual configuration from the <Link className={styles.inlineLink} href="/mcp/server-card">MCP Server Card</Link> (SEP-2127) or the domain-level <Link className={styles.inlineLink} href="/.well-known/ai-catalog.json">AI Catalog</Link>. Both documents are public JSON describing the Streamable HTTP endpoint and its supported protocol versions.
              </p>
            </article>
            <article>
              <h3 className="text-xl font-medium">The honestui CLI and npm package</h3>
              <p className="mt-3 leading-7 text-[var(--hui-color-foreground-base-secondary)]">
                Run <code>npx honestui@latest init</code> to configure a React project, then <code>npx honestui@latest add button</code> to copy a component into your repository with a reviewable file plan and dry-run support. Registry responses follow the shadcn schema, so each item already names its files, npm dependencies, and CSS variables. The <a className={styles.inlineLink} href="https://www.npmjs.com/package/honestui">honestui package on npm</a> also ships maintained imports for charts, icons, logos, vectors, and shaders.
              </p>
            </article>
            <article>
              <h3 className="text-xl font-medium">Agent-readable documentation</h3>
              <p className="mt-3 leading-7 text-[var(--hui-color-foreground-base-secondary)]">
                Point an agent at <Link className={styles.inlineLink} href="/llms.txt">llms.txt</Link> for the curated documentation index, or load the full snapshot from <Link className={styles.inlineLink} href="/llms-full.txt">llms-full.txt</Link>. Every guide is also available as Markdown by appending <code>.md</code> to its URL, and the <Link className={styles.inlineLink} href="/skill.md">Honest UI agent skill</Link> describes when and how to install, customize, and verify components. One fetch of the OpenAPI document reveals every machine-readable surface, including the Agent Skills index and the MCP Server Card location.
              </p>
            </article>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              className={previewButtonClass({ size: "large" })}
              href="/developers"
            >
              Browse all developer resources
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              className={previewButtonClass({
                size: "large",
                variant: "outline",
              })}
              href="/docs/developers"
            >
              Read the API guide
            </Link>
          </div>
        </div>
        </div>
      </section>
    </main>
  )
}
