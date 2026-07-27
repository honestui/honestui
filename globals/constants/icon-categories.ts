export interface IconCategorySummary {
  sourceKey: string;
  slug: string;
  name: string;
  count: number;
}

export const ICON_CATEGORIES: IconCategorySummary[] = [
  { sourceKey: "align", slug: "align", name: "Align", count: 22 },
  { sourceKey: "animal", slug: "animal", name: "Animal", count: 17 },
  { sourceKey: "app", slug: "app", name: "App", count: 193 },
  { sourceKey: "arrows", slug: "arrows", name: "Arrows", count: 244 },
  { sourceKey: "badge", slug: "badge", name: "Badge", count: 18 },
  { sourceKey: "book", slug: "book", name: "Book", count: 50 },
  { sourceKey: "brand", slug: "brand", name: "Brand", count: 226 },
  { sourceKey: "building", slug: "building", name: "Building", count: 40 },
  { sourceKey: "business", slug: "business", name: "Business", count: 38 },
  { sourceKey: "calendar", slug: "calendar", name: "Calendar", count: 52 },
  { sourceKey: "chart", slug: "chart", name: "Chart", count: 23 },
  { sourceKey: "circle", slug: "circle", name: "Circle", count: 46 },
  { sourceKey: "clipboard", slug: "clipboard", name: "Clipboard", count: 18 },
  { sourceKey: "clock", slug: "clock", name: "Clock", count: 19 },
  { sourceKey: "cloud", slug: "cloud", name: "Cloud", count: 21 },
  { sourceKey: "code", slug: "code", name: "Code", count: 74 },
  { sourceKey: "commerce", slug: "commerce", name: "Commerce", count: 87 },
  {
    sourceKey: "communiccation",
    slug: "communication",
    name: "Communication",
    count: 25,
  },
  { sourceKey: "cursor", slug: "cursor", name: "Cursor", count: 11 },
  { sourceKey: "design", slug: "design", name: "Design", count: 157 },
  { sourceKey: "device", slug: "device", name: "Device", count: 116 },
  { sourceKey: "document", slug: "document", name: "Document", count: 70 },
  { sourceKey: "education", slug: "education", name: "Education", count: 28 },
  { sourceKey: "emoji", slug: "emoji", name: "Emoji", count: 19 },
  { sourceKey: "file", slug: "file", name: "File", count: 80 },
  { sourceKey: "finance", slug: "finance", name: "Finance", count: 193 },
  { sourceKey: "folder", slug: "folder", name: "Folder", count: 47 },
  { sourceKey: "food", slug: "food", name: "Food", count: 42 },
  { sourceKey: "gender", slug: "gender", name: "Gender", count: 24 },
  { sourceKey: "hand", slug: "hand", name: "Hand", count: 47 },
  { sourceKey: "health", slug: "health", name: "Health", count: 36 },
  { sourceKey: "home", slug: "home", name: "Home", count: 111 },
  { sourceKey: "interface", slug: "interface", name: "Interface", count: 168 },
  { sourceKey: "layout", slug: "layout", name: "Layout", count: 122 },
  { sourceKey: "list", slug: "list", name: "List", count: 21 },
  { sourceKey: "mail", slug: "mail", name: "Mail", count: 11 },
  { sourceKey: "math", slug: "math", name: "Math", count: 20 },
  { sourceKey: "message", slug: "message", name: "Message", count: 102 },
  { sourceKey: "misc", slug: "misc", name: "Misc", count: 14 },
  { sourceKey: "monitor", slug: "monitor", name: "Monitor", count: 16 },
  { sourceKey: "multimedia", slug: "multimedia", name: "Multimedia", count: 195 },
  { sourceKey: "nature", slug: "nature", name: "Nature", count: 12 },
  { sourceKey: "navigation", slug: "navigation", name: "Navigation", count: 75 },
  { sourceKey: "network", slug: "network", name: "Network", count: 17 },
  { sourceKey: "notification", slug: "notification", name: "Notification", count: 25 },
  { sourceKey: "others", slug: "others", name: "Others", count: 571 },
  { sourceKey: "panel", slug: "panel", name: "Panel", count: 21 },
  { sourceKey: "scan", slug: "scan", name: "Scan", count: 9 },
  { sourceKey: "security", slug: "security", name: "Security", count: 60 },
  { sourceKey: "shapes", slug: "shapes", name: "Shapes", count: 4 },
  { sourceKey: "shield", slug: "shield", name: "Shield", count: 12 },
  { sourceKey: "square", slug: "square", name: "Square", count: 75 },
  { sourceKey: "support", slug: "support", name: "Support", count: 50 },
  { sourceKey: "table", slug: "table", name: "Table", count: 8 },
  { sourceKey: "text", slug: "text", name: "Text", count: 104 },
  { sourceKey: "time", slug: "time", name: "Time", count: 5 },
  { sourceKey: "transport", slug: "transport", name: "Transport", count: 39 },
  { sourceKey: "user", slug: "user", name: "User", count: 65 },
  { sourceKey: "weather", slug: "weather", name: "Weather", count: 56 },
  { sourceKey: "zodiac", slug: "zodiac", name: "Zodiac", count: 13 },
];

export const ICON_COUNT = ICON_CATEGORIES.reduce((total, category) => total + category.count, 0);

export function getIconCategorySummary(slug: string) {
  return ICON_CATEGORIES.find((category) => category.slug === slug);
}
