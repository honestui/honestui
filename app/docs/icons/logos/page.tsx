import { AssetCatalogPage } from "@/components/docs/icons/asset-catalog-page";
import { getAssetCollectionMetadata } from "@/lib/asset-collection-metadata";
import type { Metadata } from "next";

export const revalidate = false;

export function generateMetadata(): Metadata {
  return getAssetCollectionMetadata("logos");
}

export default function LogosPage() {
  return <AssetCatalogPage collection="logos" />;
}
