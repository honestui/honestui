"use client";

import type { ReactNode } from "react";
import { CompareSlider } from "@/registry/default/animated/compare-slider";

function InvoiceCard({ tone }: { tone: "light" | "dark" }) {
  const dark = tone === "dark";
  const rows: [string, string][] = [
    ["Design system", "$4,800"],
    ["Usability study", "$2,150"],
    ["Prototype build", "$3,400"],
  ];
  return (
    <div
      className={
        dark
          ? "flex size-full flex-col gap-4 bg-neutral-950 p-6 pt-14 text-neutral-100"
          : "flex size-full flex-col gap-4 bg-white p-6 pt-14 text-neutral-900"
      }
    >
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold tracking-tight">Invoice 1042</p>
        <span
          className={
            dark
              ? "rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-medium text-emerald-300"
              : "rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-700"
          }
        >
          Paid
        </span>
      </div>
      <dl className="grid gap-2 text-sm">
        {rows.map(([name, amount]) => (
          <div
            key={name}
            className={
              dark
                ? "flex justify-between border-b border-white/10 pb-2"
                : "flex justify-between border-b border-black/10 pb-2"
            }
          >
            <dt className={dark ? "text-neutral-400" : "text-neutral-500"}>{name}</dt>
            <dd className="tabular-nums">{amount}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto flex items-baseline justify-between">
        <span className={dark ? "text-sm text-neutral-400" : "text-sm text-neutral-500"}>Total</span>
        <span className="text-xl font-semibold tabular-nums">$10,350</span>
      </div>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-sm rounded-xl border border-border shadow-sm">{children}</div>;
}

export default function CompareSliderInterface() {
  return (
    <Frame>
      <CompareSlider
        hover
        label="Theme divider"
        beforeLabel="Light"
        afterLabel="Dark"
        className="h-80 w-full"
        before={<InvoiceCard tone="light" />}
        after={<InvoiceCard tone="dark" />}
      />
    </Frame>
  );
}
