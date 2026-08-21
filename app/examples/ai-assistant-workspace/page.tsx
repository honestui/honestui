import type { Metadata } from "next";

import { AiAssistantWorkspace } from "@/components/examples/ai-assistant-workspace";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI Assistant Workspace",
  description: "An Honest UI multi-assistant productivity workspace example.",
  alternates: {
    canonical: absoluteUrl("/examples/ai-assistant-workspace"),
  },
};

export default function AiAssistantWorkspacePage() {
  return <AiAssistantWorkspace />;
}
