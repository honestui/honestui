"use client";

import { CardStack } from "@/registry/default/animated/card-stack";

const TESTIMONIALS = [
  {
    quote: "We replaced three internal dashboards in a week. The tables just behave the way people expect.",
    name: "Maya Okafor",
    role: "Head of Design, Northwind",
  },
  {
    quote: "Accessibility stopped being a ticket at the end of the sprint. It ships with every component.",
    name: "Daniel Reyes",
    role: "Staff Engineer, Lumen",
  },
  {
    quote: "Our support queue for 'where did my filter go' dropped to zero after the redesign.",
    name: "Priya Shah",
    role: "Product Lead, Parcel",
  },
  {
    quote: "The motion is quiet enough for a finance app and still makes the product feel alive.",
    name: "Tom Lindqvist",
    role: "CTO, Ledgerline",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

export default function CardStackDemo() {
  return (
    <CardStack
      label="Customer stories"
      items={TESTIMONIALS}
      className="max-w-sm"
      cardClassName="flex min-h-52 flex-col"
      renderItem={(item) => (
        <figure className="m-0 flex flex-1 flex-col justify-between gap-6">
          <blockquote className="text-[15px] leading-relaxed text-foreground">
            “{item.quote}”
          </blockquote>
          <figcaption className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
            >
              {initials(item.name)}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              <span className="text-xs text-muted-foreground">{item.role}</span>
            </span>
          </figcaption>
        </figure>
      )}
    />
  );
}
