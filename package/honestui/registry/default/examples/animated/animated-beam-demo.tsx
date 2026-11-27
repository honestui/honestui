"use client";

import { Bot, Calendar, Database, FileText, Mail, MessageSquare, User } from "honestui/icons";
import { forwardRef, useRef, type ReactNode } from "react";

import { AnimatedBeam } from "@/registry/default/animated/animated-beam";
import { cn } from "@/lib/utils";

const Node = forwardRef<HTMLDivElement, { children: ReactNode; className?: string; label: string }>(
  function Node({ children, className, label }, ref) {
    return (
      <div
        ref={ref}
        role="img"
        aria-label={label}
        className={cn(
          "z-10 flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm [&_svg]:size-4.5",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

export default function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const docsRef = useRef<HTMLDivElement>(null);
  const mailRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative flex h-72 w-full max-w-lg items-center justify-between px-6">
      <div className="flex flex-col gap-4">
        <Node ref={docsRef} label="Docs"><FileText /></Node>
        <Node ref={mailRef} label="Mail"><Mail /></Node>
        <Node ref={chatRef} label="Chat"><MessageSquare /></Node>
        <Node ref={calendarRef} label="Calendar"><Calendar /></Node>
        <Node ref={dataRef} label="Database"><Database /></Node>
      </div>
      <Node ref={hubRef} label="Assistant" className="size-14 [&_svg]:size-6"><Bot /></Node>
      <Node ref={userRef} label="You"><User /></Node>

      <AnimatedBeam containerRef={containerRef} fromRef={docsRef} toRef={hubRef} />
      <AnimatedBeam containerRef={containerRef} fromRef={mailRef} toRef={hubRef} delay={0.6} />
      <AnimatedBeam containerRef={containerRef} fromRef={chatRef} toRef={hubRef} delay={1.2} />
      <AnimatedBeam containerRef={containerRef} fromRef={calendarRef} toRef={hubRef} delay={1.8} />
      <AnimatedBeam containerRef={containerRef} fromRef={dataRef} toRef={hubRef} delay={2.4} />
      <AnimatedBeam containerRef={containerRef} fromRef={hubRef} toRef={userRef} duration={3} />
    </div>
  );
}
