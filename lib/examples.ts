export interface HonestUiExample {
  name: string;
  previewHref: string;
  previewImage: string;
  previewImageDark: string;
  previewImageAlt: string;
}

export const HONEST_UI_EXAMPLES: HonestUiExample[] = [
  {
    name: "CRM Client Workspace",
    previewHref: "/examples/crm-customer-list",
    previewImage: "/examples/daybreak-client-workspace-connor-love.png",
    previewImageDark: "/examples/daybreak-client-workspace-dark-connor-love.png",
    previewImageAlt: "CRM client workspace with navigation, filters, and account data",
  },
];
