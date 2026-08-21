import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_ONLY_VALUE"
  | "INVALID_PRESET_CONFIGURATION"
  | "REGISTRY_ITEM_NOT_FOUND";

type ApiError = {
  code: ApiErrorCode;
  message: string;
  resolution: string;
};

export function jsonApiError(error: ApiError, status: number) {
  return NextResponse.json(
    {
      // Keep the original field for existing registry and CLI consumers.
      error: error.message,
      ...error,
    },
    {
      status,
      headers: { "x-content-type-options": "nosniff" },
    },
  );
}
