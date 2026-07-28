import { ChromaticTextReveal } from "@/registry/default/animated/chromatic-text-reveal";

export default function ChromaticTextRevealDemo() {
  return (
    <ChromaticTextReveal
      prefix="Build interfaces that feel"
      words={["responsive", "deliberate", "alive"]}
      once={false}
      className="px-6 text-center text-2xl font-semibold sm:text-4xl"
    />
  );
}
