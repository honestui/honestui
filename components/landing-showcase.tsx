import Link from "next/link"
import {
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  Heart,
  Package,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
} from "lucide-react"

import { GithubIcon } from "@/assets/icons"
import { LandingAccountTabs } from "@/components/landing-account-tabs"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import styles from "@/components/landing-showcase.module.css"

const previewCardClass =
  "w-[23.5rem] gap-5 rounded-[var(--hui-radius-5)] bg-[var(--hui-color-background-base-primary)] py-5 shadow-[var(--hui-shadow-lifted)] ring-[0.5px] ring-[var(--hui-color-border-base-primary)]"

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
  variant?: "secondary" | "success"
}) {
  return (
    <span
      className={cx(
        styles.badge,
        size === "small" && styles.badgeSmall,
        variant === "secondary" ? styles.badgeSecondary : styles.badgeSuccess,
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
      <span className={styles.inputControl}>
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

function SignUpCard({ idPrefix }: { idPrefix: string }) {
  return (
    <Card className={previewCardClass}>
      <CardHeader>
        <CardTitle>
          <h3>Sign up</h3>
        </CardTitle>
        <CardDescription>
          An account-flow composition built from components you can edit.
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
          id={`${idPrefix}-email`}
          label="Email"
          type="email"
          placeholder="you@example.com"
        />
        <PreviewField
          id={`${idPrefix}-password`}
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
    description: "New charts, icons, and visual tools.",
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
    <Card className={previewCardClass}>
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

function PricingCard() {
  const features = [
    "Unlimited projects",
    "Source in your repository",
    "Accessible primitives",
    "Semantic design tokens",
  ]

  return (
    <Card className={previewCardClass}>
      <CardHeader>
        <div className="mb-2 flex items-center justify-between gap-3">
          <CardTitle>
            <h3>Starter plan</h3>
          </CardTitle>
          <PreviewBadge size="small">Example</PreviewBadge>
        </div>
        <CardDescription>A compact pricing-card composition.</CardDescription>
      </CardHeader>
      <CardPanel className="space-y-6">
        <p className="text-5xl font-medium tracking-[-0.05em]">
          $19<span className="ml-1 text-base tracking-normal text-[var(--hui-color-foreground-base-secondary)]">/month</span>
        </p>
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm">
              <Check aria-hidden="true" className="size-4 text-[var(--hui-color-foreground-accent-primary)]" />
              {feature}
            </li>
          ))}
        </ul>
      </CardPanel>
      <CardFooter>
        <PreviewButton fullWidth>Choose plan</PreviewButton>
      </CardFooter>
    </Card>
  )
}

function PaymentCard() {
  return (
    <Card className={previewCardClass}>
      <CardHeader>
        <CardTitle>
          <h3>Payment method</h3>
        </CardTitle>
        <CardDescription>Add a payment method to this example account.</CardDescription>
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
              className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-[var(--hui-radius-3)] border-[0.5px] border-[var(--hui-color-border-base-primary)] bg-[var(--hui-color-background-base-primary)] text-sm font-medium outline-none transition-colors hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] aria-pressed:border-[var(--hui-color-border-accent-emphasis)] aria-pressed:bg-[var(--hui-color-background-accent-primary)]"
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </button>
          ))}
        </div>
        <PreviewField id="payment-owner" label="Cardholder" placeholder="Name on card" />
        <PreviewField id="payment-number" label="Card number" placeholder="0000 0000 0000 0000" />
        <div className="grid grid-cols-3 gap-3">
          <PreviewField id="payment-month" label="Month" placeholder="MM" />
          <PreviewField id="payment-year" label="Year" placeholder="YY" />
          <PreviewField id="payment-cvv" label="CVV" placeholder="000" />
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
    <Card className={previewCardClass}>
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
          A responsive product card with choices, status, and supporting details.
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
                className="flex size-9 items-center justify-center rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-primary)] text-sm outline-none hover:bg-[var(--hui-color-background-base-primary-hover)] focus-visible:[outline:var(--hui-focus-ring)] aria-pressed:border-[var(--hui-color-border-accent-emphasis)] aria-pressed:bg-[var(--hui-color-background-accent-primary)]"
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

function SharingCard() {
  const members = [
    { initials: "DT", label: "Design team", access: "Edit" },
    { initials: "FE", label: "Frontend team", access: "Edit" },
    { initials: "QA", label: "Quality team", access: "View" },
  ]

  return (
    <Card className={previewCardClass}>
      <CardHeader>
        <CardTitle>
          <h3>Share document</h3>
        </CardTitle>
        <CardDescription>Invite collaborators and choose their access.</CardDescription>
      </CardHeader>
      <CardPanel className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="share-link">Document link</Label>
          <div className="flex gap-2">
            <span className={styles.inputControl}>
              <input
                className={styles.input}
                id="share-link"
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

function IssueCard() {
  return (
    <Card className={previewCardClass}>
      <CardHeader>
        <CardTitle>
          <h3>Report an issue</h3>
        </CardTitle>
        <CardDescription>Describe a problem clearly enough to reproduce it.</CardDescription>
      </CardHeader>
      <CardPanel className="space-y-4">
        <PreviewField id="issue-title" label="Title" placeholder="A short, descriptive title" />
        <div className="space-y-2">
          <Label htmlFor="issue-framework">Framework</Label>
          <select
            id="issue-framework"
            defaultValue="react"
            className="h-9 w-full rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-base-tertiary)] bg-[var(--hui-color-background-base-primary)] px-3 text-sm outline-none focus:border-[var(--hui-color-border-accent-emphasis)]"
          >
            <option value="react">React</option>
            <option value="next">Next.js</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="issue-description">Description</Label>
          <textarea
            className={styles.textarea}
            id="issue-description"
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

export function LandingShowcase() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
    >
      <div className="lg:grid lg:h-[calc(100svh-4rem)] lg:grid-cols-[minmax(30rem,5fr)_6fr] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden">
      <section className="flex flex-col px-5 py-16 sm:px-8 md:py-24 lg:min-h-0 lg:py-10">
        <div className="flex flex-1 items-center lg:justify-end">
          <div className="w-full max-w-[42rem] lg:max-w-[34rem]">
            <h1 className="text-[clamp(2.375rem,10vw,3.25rem)]! leading-[0.94]! font-medium tracking-[var(--hui-letter-spacing-t4)]">
              <span className="sr-only">Honest UI: </span>
              <span className="block whitespace-nowrap">Good interfaces.</span>
              {" "}
              <span className="block whitespace-nowrap">Honest code.</span>
            </h1>
            <p className="mt-7 max-w-[38rem] text-lg leading-7 text-[var(--hui-color-foreground-base-secondary)]">
              Honest UI is a React component library with good defaults and no lock-in. Copy components into your project, change the source, and import charts, icons, and visual effects only when you need them.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
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
            <p className="mt-4 text-xs text-[var(--hui-color-foreground-base-secondary)]">
              These examples are interactive previews; they don’t submit data.
            </p>
          </div>
        </div>
        <p className="mt-12 hidden flex-wrap items-center gap-2 text-sm text-[var(--hui-color-foreground-base-secondary)] lg:flex">
          <span>MIT licensed. Source-first by design.</span>
          <Link
            className="rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
            href="/compare"
          >
            Comparisons
          </Link>
          <Link
            className="rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
            href="/privacy"
          >
            Privacy
          </Link>
          <Link
            className="rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
            href="/about"
          >
            About
          </Link>
          <Link
            className="rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
            href="/contact"
          >
            Contact
          </Link>
        </p>
      </section>

      <section
        aria-label="Honest UI component previews"
        className="min-w-0 overflow-x-auto pb-14 pl-5 sm:pl-8 lg:min-h-0 lg:overflow-visible lg:p-0"
      >
        <h2 className="sr-only">Honest UI component previews</h2>
        <div className="w-[74.5rem] origin-top-left pb-10 lg:rotate-[4deg] lg:translate-x-20 lg:translate-y-10 xl:translate-x-28">
          <div className="grid grid-cols-3 gap-7">
            <div className="flex flex-col gap-7">
              <SignUpCard idPrefix="signup-primary" />
              <NotificationsCard />
              <PricingCard />
            </div>
            <div className="flex flex-col gap-7">
              <PaymentCard />
              <EcommerceCard />
              <SignUpCard idPrefix="signup-secondary" />
            </div>
            <div className="flex flex-col gap-7">
              <SharingCard />
              <IssueCard />
              <LandingAccountTabs cardClassName={previewCardClass} />
            </div>
          </div>
        </div>
      </section>

      <p className="flex flex-wrap items-center gap-2 px-5 pb-8 text-sm text-[var(--hui-color-foreground-base-secondary)] sm:px-8 lg:hidden">
        <span>MIT licensed. Source-first by design.</span>
        <Link
          className="rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
          href="/compare"
        >
          Comparisons
        </Link>
        <Link
          className="rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
          href="/privacy"
        >
          Privacy
        </Link>
        <Link
          className="rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
          href="/about"
        >
          About
        </Link>
        <Link
          className="rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
          href="/contact"
        >
          Contact
        </Link>
      </p>
      </div>

      <section
        aria-labelledby="honest-ui-ownership"
        className="border-t border-[var(--hui-color-border-base-primary)] px-5 py-16 sm:px-8 sm:py-20"
      >
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
      </section>
    </main>
  )
}
