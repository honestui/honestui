// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import type {
  Artifact,
  ArtifactListParams,
  ArtifactStorage,
  ArtifactSummary,
} from "../adapters/types";
import { storageRequest, nextCursorOf, type StorageArtifact, type StorageListEnvelope } from "./wire";

export interface StorageArtifactStorageOptions {
  /** Honest AI storage API origin, e.g. "http://localhost:3102". */
  baseUrl: string;
  /** The token-injecting fetch from createSessionFetch. */
  fetch: typeof fetch;
  /** Default page size when the caller passes no limit. */
  pageLimit?: number;
}

function toSummary(artifact: StorageArtifact): ArtifactSummary {
  return {
    id: artifact.id,
    title: artifact.name ?? artifact.id,
    type: artifact.kind,
    threadId: artifact.conversation_id,
    updatedAt: (artifact.updated_at ?? artifact.created_at) * 1000,
  };
}

export function artifactStorageAdapter({
  baseUrl,
  fetch: fetchImpl,
  pageLimit = 100,
}: StorageArtifactStorageOptions): ArtifactStorage {
  const request = storageRequest(fetchImpl, baseUrl);

  return {
    /** GET /v1/artifacts?[name=][kind=…]&limit[&after=]. Omitting the
     *  conversation scope lists across conversations, token-scoped to the user. */
    async list(params?: ArtifactListParams) {
      const query = new URLSearchParams();
      if (params?.name !== undefined && params.name !== "") query.set("name", params.name);
      for (const type of params?.type ?? []) query.append("kind", type);
      if (params?.cursor !== undefined) query.set("after", params.cursor);
      query.set("limit", String(params?.limit ?? pageLimit));
      const res = await request(`/v1/artifacts?${query.toString()}`);
      const envelope = (await res.json()) as StorageListEnvelope<StorageArtifact>;
      return {
        artifacts: envelope.data.map(toSummary),
        nextCursor: nextCursorOf(envelope),
      };
    },

    /** GET /v1/artifacts/:id → the stored honestai-lang program (bare program;
     *  the renderer's parser sniffs the `root = …` root). */
    async get(id: string): Promise<Artifact> {
      const res = await request(`/v1/artifacts/${encodeURIComponent(id)}`);
      const artifact = (await res.json()) as StorageArtifact;
      return { ...toSummary(artifact), content: artifact.content };
    },

    /** POST /v1/artifacts/:id {content}. Send the edited inner program (a
     *  string); omit version to let the server bump it. */
    async update(patch: { id: string; content: unknown }): Promise<ArtifactSummary> {
      const content =
        typeof patch.content === "string" ? patch.content : JSON.stringify(patch.content);
      const res = await request(`/v1/artifacts/${encodeURIComponent(patch.id)}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      return toSummary((await res.json()) as StorageArtifact);
    },
  };
}
