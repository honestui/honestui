import type { ReactNode } from "react";

export type GooeyState =
	| "success"
	| "loading"
	| "error"
	| "warning"
	| "info"
	| "action";

export interface GooeyStyles {
	title?: string;
	description?: string;
	badge?: string;
	button?: string;
}

export interface GooeyButton {
	title: string;
	onClick: () => void;
}

export const GOOEY_POSITIONS = [
	"top-left",
	"top-center",
	"top-right",
	"bottom-left",
	"bottom-center",
	"bottom-right",
] as const;

export type GooeyPosition = (typeof GOOEY_POSITIONS)[number];

export interface GooeyOptions {
	title?: string;
	description?: ReactNode | string;
	position?: GooeyPosition;
	duration?: number | null;
	icon?: ReactNode | null;
	styles?: GooeyStyles;
	fill?: string;
	roundness?: number;
	autopilot?: boolean | { expand?: number; collapse?: number };
	button?: GooeyButton;
}