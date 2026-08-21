import {
  getVersionedApiIndex,
  versionedMethodNotAllowed,
  versionedOptions,
} from "@/lib/versioned-api";

export function GET() {
  return getVersionedApiIndex();
}

export const POST = versionedMethodNotAllowed;
export const PUT = versionedMethodNotAllowed;
export const PATCH = versionedMethodNotAllowed;
export const DELETE = versionedMethodNotAllowed;

export const OPTIONS = versionedOptions;
