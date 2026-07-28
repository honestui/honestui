import { TextReveal } from "@/registry/default/animated/text-reveal";

export default function TextRevealDemo() {
  return (
    <TextReveal
      text={["Ideas made tangible.", "Craft built to last."]}
      as="p"
      className="px-6 text-center text-3xl font-semibold leading-tight sm:text-5xl"
      stagger={0.08}
    />
  );
}
