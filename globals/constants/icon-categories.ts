export interface IconCategorySummary {
  sourceKey: string;
  slug: string;
  name: string;
  count: number;
}

export type AssetCollection = "icons" | "logos" | "vectors";

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

export const LOGO_CATEGORIES: IconCategorySummary[] = [
  { sourceKey: "adobe", slug: "adobe", name: "Adobe", count: 12 },
  { sourceKey: "ai", slug: "ai", name: "AI", count: 26 },
  { sourceKey: "browser", slug: "browser", name: "Browser", count: 12 },
  { sourceKey: "cards", slug: "cards", name: "Cards", count: 25 },
  { sourceKey: "cms", slug: "cms", name: "CMS", count: 10 },
  { sourceKey: "crypto", slug: "crypto", name: "Crypto", count: 15 },
  { sourceKey: "database", slug: "database", name: "Database", count: 14 },
  { sourceKey: "design", slug: "design", name: "Design", count: 10 },
  { sourceKey: "devtool", slug: "devtool", name: "Developer Tools", count: 10 },
  { sourceKey: "flags", slug: "flags", name: "Flags", count: 227 },
  { sourceKey: "framework", slug: "framework", name: "Frameworks", count: 36 },
  { sourceKey: "google", slug: "google", name: "Google", count: 39 },
  { sourceKey: "language", slug: "language", name: "Languages", count: 25 },
  { sourceKey: "library", slug: "library", name: "Libraries", count: 45 },
  { sourceKey: "music", slug: "music", name: "Music", count: 3 },
  { sourceKey: "payment", slug: "payment", name: "Payment", count: 5 },
  { sourceKey: "social", slug: "social", name: "Social", count: 18 },
  { sourceKey: "software", slug: "software", name: "Software", count: 31 },
  { sourceKey: "sports", slug: "sports", name: "Sports", count: 1 },
  { sourceKey: "stickers", slug: "stickers", name: "Stickers", count: 1 },
];

export const VECTOR_CATEGORIES: IconCategorySummary[] = [
  { sourceKey: "abstract", slug: "abstract", name: "Abstract", count: 229 },
  { sourceKey: "arrows", slug: "arrows", name: "Arrows", count: 74 },
  { sourceKey: "busts", slug: "busts", name: "Busts", count: 105 },
  { sourceKey: "ellipse", slug: "ellipse", name: "Ellipse", count: 12 },
  { sourceKey: "flower", slug: "flower", name: "Flowers", count: 16 },
  { sourceKey: "geometric", slug: "geometric", name: "Geometric", count: 96 },
  { sourceKey: "misc", slug: "misc", name: "Misc", count: 11 },
  { sourceKey: "moon", slug: "moon", name: "Moon", count: 15 },
  { sourceKey: "number", slug: "number", name: "Numbers", count: 10 },
  { sourceKey: "organic", slug: "organic", name: "Organic", count: 97 },
  { sourceKey: "polygon", slug: "polygon", name: "Polygons", count: 8 },
  { sourceKey: "rectangle", slug: "rectangle", name: "Rectangles", count: 9 },
  { sourceKey: "scribble", slug: "scribble", name: "Scribbles", count: 150 },
  { sourceKey: "sitting", slug: "sitting", name: "Sitting People", count: 18 },
  { sourceKey: "standing", slug: "standing", name: "Standing People", count: 30 },
  { sourceKey: "stars", slug: "stars", name: "Stars", count: 13 },
  { sourceKey: "triangle", slug: "triangle", name: "Triangles", count: 14 },
  { sourceKey: "wheel", slug: "wheel", name: "Wheels", count: 7 },
];

export const ASSET_CATEGORIES: Record<AssetCollection, IconCategorySummary[]> = {
  icons: ICON_CATEGORIES,
  logos: LOGO_CATEGORIES,
  vectors: VECTOR_CATEGORIES,
};

export const ASSET_COUNTS: Record<AssetCollection, number> = {
  icons: ICON_COUNT,
  logos: LOGO_CATEGORIES.reduce((total, category) => total + category.count, 0),
  vectors: VECTOR_CATEGORIES.reduce((total, category) => total + category.count, 0),
};

export function getIconCategorySummary(slug: string) {
  return ICON_CATEGORIES.find((category) => category.slug === slug);
}

export function getAssetCategorySummary(collection: AssetCollection, slug: string) {
  return ASSET_CATEGORIES[collection].find((category) => category.slug === slug);
}
