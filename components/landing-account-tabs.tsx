"use client"

import { useRef, useState } from "react"

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

const tabs = ["login", "register"] as const
type Tab = (typeof tabs)[number]

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function AccountField({
  id,
  label,
  placeholder,
  type,
}: {
  id: string
  label: string
  placeholder: string
  type: React.HTMLInputTypeAttribute
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <span className={styles.inputControl}>
        <input
          className={styles.input}
          id={id}
          placeholder={placeholder}
          type={type}
        />
      </span>
    </div>
  )
}

export function LandingAccountTabs({ cardClassName }: { cardClassName: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("login")
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    login: null,
    register: null,
  })

  function selectAdjacentTab(current: Tab, direction: -1 | 1) {
    const currentIndex = tabs.indexOf(current)
    const nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length]
    setActiveTab(nextTab)
    tabRefs.current[nextTab]?.focus()
  }

  return (
    <Card className={cardClassName}>
      <div className={styles.tabs}>
        <div aria-label="Account action" className={styles.tabsList} role="tablist">
          {tabs.map((tab) => (
            <button
              aria-controls={`${tab}-panel`}
              aria-selected={activeTab === tab}
              className={cx(styles.tab, activeTab === tab && styles.tabActive)}
              id={`${tab}-tab`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  event.preventDefault()
                  selectAdjacentTab(tab, -1)
                }
                if (event.key === "ArrowRight") {
                  event.preventDefault()
                  selectAdjacentTab(tab, 1)
                }
                if (event.key === "Home") {
                  event.preventDefault()
                  setActiveTab("login")
                  tabRefs.current.login?.focus()
                }
                if (event.key === "End") {
                  event.preventDefault()
                  setActiveTab("register")
                  tabRefs.current.register?.focus()
                }
              }}
              ref={(element) => {
                tabRefs.current[tab] = element
              }}
              role="tab"
              tabIndex={activeTab === tab ? 0 : -1}
              type="button"
            >
              {tab === "login" ? "Log in" : "Register"}
            </button>
          ))}
        </div>

        <div
          aria-labelledby={`${activeTab}-tab`}
          className={styles.tabPanel}
          id={`${activeTab}-panel`}
          role="tabpanel"
          tabIndex={0}
        >
          <CardHeader className="mt-5">
            <CardTitle>
              <h3>{activeTab === "login" ? "Welcome back" : "Create an account"}</h3>
            </CardTitle>
            <CardDescription>
              {activeTab === "login"
                ? "Enter your credentials to continue."
                : "Start with your email and a password."}
            </CardDescription>
          </CardHeader>
          <CardPanel className="mt-5 space-y-4">
            <AccountField
              id={`${activeTab}-email`}
              label="Email"
              placeholder="you@example.com"
              type="email"
            />
            <AccountField
              id={`${activeTab}-password`}
              label="Password"
              placeholder={activeTab === "login" ? "Enter your password" : "Choose a password"}
              type="password"
            />
          </CardPanel>
          <CardFooter className="mt-5">
            <button
              className={cx(styles.button, styles.buttonDefault, "w-full")}
              type="button"
            >
              {activeTab === "login" ? "Log in" : "Register"}
            </button>
          </CardFooter>
        </div>
      </div>
    </Card>
  )
}
