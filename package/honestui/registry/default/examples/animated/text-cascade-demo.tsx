"use client";

import { useEffect, useState } from "react";

import { TextCascade } from "@/registry/default/animated/text-cascade";

const words = ["Design", "Build", "Ship"];

export default function TextCascadeDemo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % words.length), 1600);
    return () => window.clearInterval(timer);
  }, []);

  return <TextCascade text={words[index]} className="text-4xl font-semibold" />;
}
