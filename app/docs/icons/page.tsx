import { AssetCatalogPage } from "@/components/docs/icons/asset-catalog-page";
import { getAssetCollectionMetadata } from "@/lib/asset-collection-metadata";
import type { Metadata } from "next";

export const revalidate = false;

export function generateMetadata(): Metadata {
  return getAssetCollectionMetadata("icons");
}

export default function IconsPage() {
  return <AssetCatalogPage collection="icons" />;
}
