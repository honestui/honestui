import type { Metadata } from "next";
import { BrandWordmark } from "@/components/brand-wordmark";

export const metadata: Metadata = {
  title: "Honest UI",
  description:
    "A source-first React UI library with polished components, blocks, charts, icons, and agent skills you can copy, customize, and own.",
};

export default function Home() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <BrandWordmark className="text-3xl" markClassName="size-12" />
    </div>
  );
}
