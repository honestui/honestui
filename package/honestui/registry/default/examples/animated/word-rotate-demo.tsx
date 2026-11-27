"use client";

import { WordRotate } from "@/registry/default/animated/word-rotate";

const WORDS = ["designers", "engineers", "product teams", "everyone"];

export default function WordRotateDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Built for <WordRotate words={WORDS} className="text-muted-foreground" />
      </h3>
      <div className="grid gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <p>
          Blur:{" "}
          <WordRotate
            variant="blur"
            interval={2000}
            words={["Syncing", "Indexing", "Ready"]}
            className="font-medium text-foreground"
          />
        </p>
        <p>
          Fade:{" "}
          <WordRotate
            variant="fade"
            interval={2800}
            pauseOnHover
            words={["3 reviewers", "12 comments", "1 approval"]}
            className="font-medium text-foreground"
          />
        </p>
      </div>
    </div>
  );
}
