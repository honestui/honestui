export interface HonestUiExample {
  name: string;
  description: string;
  previewHref: string;
  previewImage: string;
  previewImageDark: string;
  previewImageAlt: string;
}

export const HONEST_UI_EXAMPLES: HonestUiExample[] = [
  {
    name: "CRM Client Workspace",
    description: "Full-page client management workspace",
    previewHref: "/examples/crm-customer-list",
    previewImage: "/examples/crm-client-workspace.png",
    previewImageDark: "/examples/crm-client-workspace-dark.png",
    previewImageAlt: "CRM client workspace with navigation, filters, and account data",
  },
  {
    name: "AI Assistant Workspace",
    description: "Full-page multi-assistant productivity workspace",
    previewHref: "/examples/ai-assistant-workspace",
    previewImage: "/examples/ai-assistant-workspace.png",
    previewImageDark: "/examples/ai-assistant-workspace-dark.png",
    previewImageAlt:
      "AI assistant workspace with navigation, prompt composer, conversations, and connected tools",
  },
];
