"use client"

import dynamic from "next/dynamic"
import { useState } from "react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card"
import { CodeTokens } from "@/components/landing/code-tokens"
import styles from "@/components/landing-showcase.module.css"
import { NumberTicker } from "@/registry/default/animated/number-ticker"

// ECharts and the WebGL shader are large and never needed for first paint, so
// they load in their own chunks after the hero is interactive.
const LandingAreaChart = dynamic(() => import("@/components/landing-area-chart"), {
  ssr: false,
})

const Grainient = dynamic(
  () => import("honestui/shaders").then((module) => module.Grainient),
  { ssr: false },
)

const SHADER_COLORS = ["#4c6ef5", "#b197fc", "#12b886"] as const

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function CollectionHeader({
  collection,
  description,
  title,
}: {
  collection: string
  description: string
  title: string
}) {
  return (
    <CardHeader>
      <div className="mb-2 flex items-center justify-between gap-3">
        <CardTitle>
          <h3>{title}</h3>
        </CardTitle>
        <span className={cx(styles.badge, styles.badgeSmall, styles.badgeSecondary)}>
          {collection}
        </span>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  )
}

type PreviewCardProps = { cardClassName: string; xray?: boolean }

// In the x-ray layer the heavy renderers are replaced by a drawing of what
// they produce, so the lens never mounts a second chart or WebGL context.
function XrayPlaceholder({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="relative size-full" data-xray-fill="">
      {children}
      <span className="absolute top-2 left-2 font-mono text-[10px]">{label}</span>
    </div>
  )
}

export function LandingChartCard({ cardClassName, xray = false }: PreviewCardProps) {
  return (
    <Card className={cardClassName} data-xray="<AreaChart> · honestui/charts">
      <CollectionHeader
        collection="Charts"
        description="An area chart drawn from sample monthly data."
        title="Bike rentals"
      />
      <CardPanel>
        <div className="h-44">
          {xray ? (
            <XrayPlaceholder label="<canvas> echarts · 7 points">
              <svg className="size-full" preserveAspectRatio="none" viewBox="0 0 300 120">
                <path
                  d="M0 96 L50 90 L100 74 L150 78 L200 60 L250 38 L300 20 L300 120 L0 120 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </XrayPlaceholder>
          ) : (
            <LandingAreaChart />
          )}
        </div>
      </CardPanel>
    </Card>
  )
}

export function LandingShaderCard({ cardClassName, xray = false }: PreviewCardProps) {
  return (
    <Card className={cardClassName} data-xray="<Grainient> · honestui/shaders">
      <CollectionHeader
        collection="Shaders"
        description="A GPU-rendered gradient with film grain."
        title="Grainient"
      />
      <CardPanel>
        {/* The CSS gradient shows while the shader loads and when WebGL is unavailable. */}
        <div
          aria-hidden="true"
          className="h-40 overflow-hidden rounded-[var(--hui-radius-3)]"
          style={
            xray
              ? undefined
              : { background: `linear-gradient(135deg, ${SHADER_COLORS.join(", ")})` }
          }
        >
          {xray ? (
            <XrayPlaceholder label="<canvas> webgl · fragment shader" />
          ) : (
          <Grainient
            className="size-full"
            color1={SHADER_COLORS[0]}
            color2={SHADER_COLORS[1]}
            color3={SHADER_COLORS[2]}
            grainAmount={0.08}
          />
          )}
        </div>
      </CardPanel>
    </Card>
  )
}

const SIGNUPS_START = 847
const SIGNUPS_STEP = 12

export function LandingTickerCard({ cardClassName, xray = false }: PreviewCardProps) {
  const [signups, setSignups] = useState(SIGNUPS_START)

  return (
    <Card className={cardClassName} data-xray="<NumberTicker> · animated">
      <CollectionHeader
        collection="Animated"
        description="Number Ticker rolls each digit when the value changes."
        title="Signups today"
      />
      <CardPanel className="flex items-end justify-between gap-4">
        {xray ? (
          <CodeTokens className="font-mono text-sm" code="<NumberTicker value={n} />" />
        ) : (
          <NumberTicker
            className="text-5xl font-medium"
            value={signups}
          />
        )}
        <button
          className={cx(styles.button, styles.buttonOutline)}
          onClick={() => setSignups((current) => current + SIGNUPS_STEP)}
          type="button"
        >
          Add {SIGNUPS_STEP}
        </button>
      </CardPanel>
    </Card>
  )
}
