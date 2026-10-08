"use client";

import type { AssetCollection } from "@/globals/constants/icon-categories";
import { useEffect, useSyncExternalStore, type ComponentType, type SVGProps } from "react";

export type AssetComponent = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number }
>;

type AssetModule = Record<string, AssetComponent | undefined>;

interface AssetModuleSnapshot {
  loaded: Record<string, AssetModule | undefined>;
  failed: Record<string, true | undefined>;
}

// One chunk per category keeps the catalog out of the page bundle: a category's
// SVG components download only when one of its assets is about to be shown.
const importers: Record<AssetCollection, (sourceKey: string) => Promise<unknown>> = {
  icons: (sourceKey) => import(`@/package/honestui/src/assets/icons/${sourceKey}/index.tsx`),
  logos: (sourceKey) => import(`@/package/honestui/src/assets/logos/${sourceKey}/index.tsx`),
  vectors: (sourceKey) => import(`@/package/honestui/src/assets/vectors/${sourceKey}/index.tsx`),
};

const emptySnapshot: AssetModuleSnapshot = { loaded: {}, failed: {} };
let snapshot = emptySnapshot;
const pending = new Set<string>();
const listeners = new Set<() => void>();

function moduleId(collection: AssetCollection, sourceKey: string) {
  return `${collection}/${sourceKey}`;
}

function publish(next: AssetModuleSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function loadAssetModule(collection: AssetCollection, sourceKey: string) {
  const id = moduleId(collection, sourceKey);
  if (snapshot.loaded[id] || snapshot.failed[id] || pending.has(id)) return;

  pending.add(id);
  importers[collection](sourceKey)
    .then((loadedModule) => {
      publish({
        ...snapshot,
        loaded: { ...snapshot.loaded, [id]: loadedModule as AssetModule },
      });
    })
    .catch(() => {
      publish({ ...snapshot, failed: { ...snapshot.failed, [id]: true } });
    })
    .finally(() => {
      pending.delete(id);
    });
}

export function retryFailedAssetModules(collection: AssetCollection, sourceKeys: string[]) {
  const failed = { ...snapshot.failed };
  for (const sourceKey of sourceKeys) delete failed[moduleId(collection, sourceKey)];
  publish({ ...snapshot, failed });

  for (const sourceKey of sourceKeys) loadAssetModule(collection, sourceKey);
}

export function useAssetModules(collection: AssetCollection, sourceKeys: string[]) {
  const current = useSyncExternalStore(subscribe, () => snapshot, () => emptySnapshot);
  const requestedKeys = sourceKeys.join(",");

  useEffect(() => {
    if (!requestedKeys) return;
    for (const sourceKey of requestedKeys.split(",")) loadAssetModule(collection, sourceKey);
  }, [collection, requestedKeys]);

  return {
    getComponent(sourceKey: string, exportName: string) {
      return current.loaded[moduleId(collection, sourceKey)]?.[exportName];
    },
    failedSourceKeys: sourceKeys.filter((sourceKey) => current.failed[moduleId(collection, sourceKey)]),
  };
}
