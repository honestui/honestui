import { ChromaticTextReveal } from "@/registry/default/animated/chromatic-text-reveal";

export default function ChromaticTextRevealDemo() {
  return (
    <ChromaticTextReveal
      prefix="Make every interaction feel"
      words={["clear", "natural", "polished"]}
      once={false}
      className="w-full justify-center px-6 text-center text-xl font-semibold sm:text-3xl"
    />
  );
}
