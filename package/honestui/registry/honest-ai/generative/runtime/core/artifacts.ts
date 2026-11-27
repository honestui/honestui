// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
export type ArtifactKind = "slides" | "report";

export interface ArtifactOption {
  type: ArtifactKind;
  /** Per-artifact instruction, folded into the application tool description. */
  instruction?: string;
  /** Optional version of your application artifact library. */
  libraryVersion?: string;
}

export interface ArtifactToolOptions {
  /** Which artifacts to enable. Omit to enable all artifact types. */
  artifacts?: Array<ArtifactKind | ArtifactOption>;
}

export interface ArtifactWireEntry {
  artifact_type: ArtifactKind;
  instruction?: string;
  library_version?: string;
}

/** The Responses `tools[]` entry describing application-supported artifacts. */
export interface ResponsesArtifactToolEntry {
  type: "artifact";
  /** Absent → all supported artifact types enabled. */
  artifacts?: ArtifactWireEntry[];
}

/** Build artifact metadata for an application-owned artifact handler.
 * This describes requested output; it does not generate artifacts. */
export function artifactTool(options: ArtifactToolOptions = {}): ResponsesArtifactToolEntry {
  const { artifacts } = options;
  if (artifacts === undefined) {
    return { type: "artifact", artifacts: [{ artifact_type: "slides" }, { artifact_type: "report" }] };
  }
  if (artifacts.length === 0) {
    throw new Error(
      "artifactTool: `artifacts` must not be empty — omit it to enable all artifact types.",
    );
  }

  const seen = new Set<ArtifactKind>();
  const entries: ArtifactWireEntry[] = artifacts.map((artifact) => {
    const opt: ArtifactOption = typeof artifact === "string" ? { type: artifact } : artifact;
    if (!(["slides", "report"] as string[]).includes(opt.type)) {
      throw new Error(
        `artifactTool: unknown artifact type '${opt.type}'. Supported: slides, report.`,
      );
    }
    if (seen.has(opt.type)) {
      throw new Error(`artifactTool: duplicate artifact '${opt.type}'.`);
    }
    seen.add(opt.type);
    return {
      artifact_type: opt.type,
      ...(opt.instruction && { instruction: opt.instruction }),
      ...(opt.libraryVersion && { library_version: opt.libraryVersion }),
    };
  });
  return { type: "artifact", artifacts: entries };
}
