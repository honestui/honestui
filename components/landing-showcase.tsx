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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const previewCardClass =
  "w-[23.5rem] gap-5 rounded-[var(--hui-radius-5)] bg-[var(--hui-color-background-base-primary)] py-5 shadow-[var(--hui-shadow-lifted)] ring-[0.5px] ring-[var(--hui-color-border-base-primary)]"

const previewLabelClass =
  "text-sm font-medium text-[var(--hui-color-foreground-base-primary)]"

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
      <Input id={id} type={type} placeholder={placeholder} />
    </div>
  )
}

function SignUpCard({ idPrefix }: { idPrefix: string }) {
  return (
    <Card className={previewCardClass}>
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
        <CardDescription>
          An account-flow composition built from components you can edit.
        </CardDescription>
      </CardHeader>
      <CardPanel className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button className="w-full" variant="outline">
            <span aria-hidden="true" className="font-semibold">G</span>
            Google
          </Button>
          <Button className="w-full" variant="outline">
            <GithubIcon aria-hidden="true" />
            GitHub
          </Button>
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
        <Button className="w-full">Create account</Button>
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
        <CardTitle>Notifications</CardTitle>
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
            <Switch
              aria-label={option.label}
              defaultChecked={option.checked}
              className="mt-1"
            />
          </div>
        ))}
      </CardPanel>
      <CardFooter>
        <Button className="w-full" variant="outline">Save preferences</Button>
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
          <CardTitle>Starter plan</CardTitle>
          <Badge variant="secondary" size="sm">Example</Badge>
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
        <Button className="w-full">Choose plan</Button>
      </CardFooter>
    </Card>
  )
}

function PaymentCard() {
  return (
    <Card className={previewCardClass}>
      <CardHeader>
        <CardTitle>Payment method</CardTitle>
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
        <Button className="w-full">Continue</Button>
      </CardFooter>
    </Card>
  )
}

function EcommerceCard() {
  const sizes = ["38", "39", "40", "41", "42", "43"]

  return (
    <Card className={previewCardClass}>
      <CardHeader className="gap-3">
        <Badge className="w-fit" variant="success">In stock</Badge>
        <CardTitle className="text-2xl">Studio sneakers</CardTitle>
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
          <Button className="w-full">Add to cart</Button>
          <Button aria-label="Save item" size="icon-lg" variant="outline">
            <Heart aria-hidden="true" />
          </Button>
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
        <CardTitle>Share document</CardTitle>
        <CardDescription>Invite collaborators and choose their access.</CardDescription>
      </CardHeader>
      <CardPanel className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="share-link">Document link</Label>
          <div className="flex gap-2">
            <Input id="share-link" readOnly value="https://honestui.com/docs" />
            <Button aria-label="Copy document link" size="icon-lg" variant="outline">
              <Copy aria-hidden="true" />
            </Button>
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
              <Badge variant="secondary">{member.access}</Badge>
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
        <CardTitle>Report an issue</CardTitle>
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
          <Textarea id="issue-description" rows={4} placeholder="What happened, and what did you expect?" />
        </div>
      </CardPanel>
      <CardFooter className="justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button>Submit issue</Button>
      </CardFooter>
    </Card>
  )
}

function AccountTabsCard() {
  return (
    <Card className={previewCardClass}>
      <Tabs defaultValue="login" size="medium">
        <TabsList className="mx-5 w-auto" variant="plain">
          <TabsTab value="login">Log in</TabsTab>
          <TabsTab value="register">Register</TabsTab>
        </TabsList>
        <TabsPanel value="login">
          <CardHeader className="mt-5">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue.</CardDescription>
          </CardHeader>
          <CardPanel className="mt-5 space-y-4">
            <PreviewField id="login-email" label="Email" type="email" placeholder="you@example.com" />
            <PreviewField id="login-password" label="Password" type="password" placeholder="Enter your password" />
          </CardPanel>
          <CardFooter className="mt-5">
            <Button className="w-full">Log in</Button>
          </CardFooter>
        </TabsPanel>
        <TabsPanel value="register">
          <CardHeader className="mt-5">
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Start with your email and a password.</CardDescription>
          </CardHeader>
          <CardPanel className="mt-5 space-y-4">
            <PreviewField id="register-email" label="Email" type="email" placeholder="you@example.com" />
            <PreviewField id="register-password" label="Password" type="password" placeholder="Choose a password" />
          </CardPanel>
          <CardFooter className="mt-5">
            <Button className="w-full">Register</Button>
          </CardFooter>
        </TabsPanel>
      </Tabs>
    </Card>
  )
}

export function LandingShowcase() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="lg:grid lg:h-[calc(100svh-4rem)] lg:grid-cols-[minmax(30rem,5fr)_6fr] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden"
    >
      <section className="flex flex-col px-5 py-16 sm:px-8 md:py-24 lg:min-h-0 lg:py-10">
        <div className="flex flex-1 items-center lg:justify-end">
          <div className="w-full max-w-[42rem] lg:max-w-[34rem]">
            <h1 className="text-[clamp(2.375rem,10vw,3.25rem)]! leading-[0.94]! font-medium tracking-[var(--hui-letter-spacing-t4)]">
              <span className="block whitespace-nowrap">Good interfaces.</span>
              {" "}
              <span className="block whitespace-nowrap">Honest code.</span>
            </h1>
            <p className="mt-7 max-w-[38rem] text-lg leading-7 text-[var(--hui-color-foreground-base-secondary)]">
              HonestUI is a React component library with good defaults and no lock-in. Copy components into your project, change the source, and import charts, icons, and visual effects only when you need them.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button render={<Link href="/docs/get-started" />} size="xl">
                Get started
                <ArrowRight aria-hidden="true" />
              </Button>
              <Button
                className="hover:bg-[var(--hui-color-background-base-primary-hover)] active:bg-[var(--hui-color-background-neutral-secondary)]"
                render={<Link href="/docs/component-guide" />}
                size="xl"
                variant="outline"
              >
                Browse components
              </Button>
            </div>
            <p className="mt-4 text-xs text-[var(--hui-color-foreground-base-secondary)]">
              These examples are interactive previews; they don’t submit data.
            </p>
          </div>
        </div>
        <p className="mt-12 hidden items-center gap-2 text-sm text-[var(--hui-color-foreground-base-secondary)] lg:flex">
          <span>MIT licensed. Source-first by design.</span>
          <Link
            className="rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
            href="/privacy"
          >
            Privacy
          </Link>
        </p>
      </section>

      <section
        aria-label="Honest UI component previews"
        className="min-w-0 overflow-x-auto pb-14 pl-5 sm:pl-8 lg:min-h-0 lg:overflow-visible lg:p-0"
      >
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
              <AccountTabsCard />
            </div>
          </div>
        </div>
      </section>

      <p className="flex items-center gap-2 px-5 pb-8 text-sm text-[var(--hui-color-foreground-base-secondary)] sm:px-8 lg:hidden">
        <span>MIT licensed. Source-first by design.</span>
        <Link
          className="rounded-[var(--hui-radius-1)] underline-offset-4 outline-none hover:underline focus-visible:[outline:var(--hui-focus-ring)]"
          href="/privacy"
        >
          Privacy
        </Link>
      </p>
    </main>
  )
}
