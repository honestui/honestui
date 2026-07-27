import {
	type CSSProperties,
	type MouseEventHandler,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Gooey } from "./toast-gooey-renderer";
import "./toast-gooey.css";
import {
	GOOEY_POSITIONS,
	type GooeyOptions,
	type GooeyPosition,
	type GooeyState,
} from "./toast-gooey-types";
export type { GooeyOptions, GooeyState } from "./toast-gooey-types";

/* -------------------------------- Constants ------------------------------- */

const DEFAULT_DURATION = 6000;
const EXIT_DURATION = DEFAULT_DURATION * 0.1;
const AUTO_EXPAND_DELAY = DEFAULT_DURATION * 0.025;
const AUTO_COLLAPSE_DELAY = DEFAULT_DURATION - 2000;

const pillAlign = (pos: GooeyPosition) =>
	pos.includes("right") ? "right" : pos.includes("center") ? "center" : "left";
const expandDir = (pos: GooeyPosition) =>
	pos.startsWith("top") ? ("bottom" as const) : ("top" as const);

/* ---------------------------------- Types --------------------------------- */

interface InternalGooeyOptions extends GooeyOptions {
	id?: string;
	state?: GooeyState;
}

interface GooeyItem extends InternalGooeyOptions {
	id: string;
	instanceId: string;
	exiting?: boolean;
	autoExpandDelayMs?: number;
	autoCollapseDelayMs?: number;
}

type GooeyOffsetValue = number | string;
type GooeyOffsetConfig = Partial<
	Record<"top" | "right" | "bottom" | "left", GooeyOffsetValue>
>;

export interface GooeyToasterProps {
	children?: ReactNode;
	position?: GooeyPosition;
	offset?: GooeyOffsetValue | GooeyOffsetConfig;
	options?: Partial<GooeyOptions>;
}

/* ------------------------------ Global State ------------------------------ */

type GooeyListener = (toasts: GooeyItem[]) => void;

const store = {
	toasts: [] as GooeyItem[],
	listeners: new Set<GooeyListener>(),
	position: "top-right" as GooeyPosition,
	options: undefined as Partial<GooeyOptions> | undefined,

	emit() {
		for (const fn of this.listeners) fn(this.toasts);
	},

	update(fn: (prev: GooeyItem[]) => GooeyItem[]) {
		this.toasts = fn(this.toasts);
		this.emit();
	},
};

let idCounter = 0;
const generateId = () =>
	`${++idCounter}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const timeoutKey = (t: GooeyItem) => `${t.id}:${t.instanceId}`;

/* ------------------------------- Toast API -------------------------------- */

const dismissToast = (id: string) => {
	const item = store.toasts.find((t) => t.id === id);
	if (!item || item.exiting) return;

	store.update((prev) =>
		prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
	);

	setTimeout(
		() => store.update((prev) => prev.filter((t) => t.id !== id)),
		EXIT_DURATION,
	);
};

const resolveAutopilot = (
	opts: InternalGooeyOptions,
	duration: number | null,
): { expandDelayMs?: number; collapseDelayMs?: number } => {
	if (opts.autopilot === false || !duration || duration <= 0) return {};
	const cfg = typeof opts.autopilot === "object" ? opts.autopilot : undefined;
	const clamp = (v: number) => Math.min(duration, Math.max(0, v));
	return {
		expandDelayMs: clamp(cfg?.expand ?? AUTO_EXPAND_DELAY),
		collapseDelayMs: clamp(cfg?.collapse ?? AUTO_COLLAPSE_DELAY),
	};
};

const mergeOptions = (options: InternalGooeyOptions) => ({
	...store.options,
	...options,
	styles: { ...store.options?.styles, ...options.styles },
});

const buildGooeyItem = (
	merged: InternalGooeyOptions,
	id: string,
	fallbackPosition?: GooeyPosition,
): GooeyItem => {
	const duration = merged.duration ?? DEFAULT_DURATION;
	const auto = resolveAutopilot(merged, duration);
	return {
		...merged,
		id,
		instanceId: generateId(),
		position: merged.position ?? fallbackPosition ?? store.position,
		autoExpandDelayMs: auto.expandDelayMs,
		autoCollapseDelayMs: auto.collapseDelayMs,
	};
};

const createToast = (options: InternalGooeyOptions) => {
	const live = store.toasts.filter((t) => !t.exiting);
	const merged = mergeOptions(options);

	const id = merged.id ?? "gooey-default";
	const prev = live.find((t) => t.id === id);
	const item = buildGooeyItem(merged, id, prev?.position);

	if (prev) {
		store.update((p) => p.map((t) => (t.id === id ? item : t)));
	} else {
		store.update((p) => [...p.filter((t) => t.id !== id), item]);
	}
	return { id, duration: merged.duration ?? DEFAULT_DURATION };
};

const updateToast = (id: string, options: InternalGooeyOptions) => {
	const existing = store.toasts.find((t) => t.id === id);
	if (!existing) return;

	const item = buildGooeyItem(mergeOptions(options), id, existing.position);
	store.update((prev) => prev.map((t) => (t.id === id ? item : t)));
};

export interface GooeyPromiseOptions<T = unknown> {
	loading: Pick<GooeyOptions, "title" | "icon">;
	success: GooeyOptions | ((data: T) => GooeyOptions);
	error: GooeyOptions | ((err: unknown) => GooeyOptions);
	action?: GooeyOptions | ((data: T) => GooeyOptions);
	position?: GooeyPosition;
}

export const gooey = {
	show: (opts: GooeyOptions) => createToast(opts).id,
	success: (opts: GooeyOptions) =>
		createToast({ ...opts, state: "success" }).id,
	error: (opts: GooeyOptions) => createToast({ ...opts, state: "error" }).id,
	warning: (opts: GooeyOptions) =>
		createToast({ ...opts, state: "warning" }).id,
	info: (opts: GooeyOptions) => createToast({ ...opts, state: "info" }).id,
	action: (opts: GooeyOptions) => createToast({ ...opts, state: "action" }).id,

	promise: <T,>(
		promise: Promise<T> | (() => Promise<T>),
		opts: GooeyPromiseOptions<T>,
	): Promise<T> => {
		const { id } = createToast({
			...opts.loading,
			state: "loading",
			duration: null,
			position: opts.position,
		});

		const p = typeof promise === "function" ? promise() : promise;

		p.then((data) => {
			if (opts.action) {
				const actionOpts =
					typeof opts.action === "function" ? opts.action(data) : opts.action;
				updateToast(id, { ...actionOpts, state: "action", id });
			} else {
				const successOpts =
					typeof opts.success === "function"
						? opts.success(data)
						: opts.success;
				updateToast(id, { ...successOpts, state: "success", id });
			}
		}).catch((err) => {
			const errorOpts =
				typeof opts.error === "function" ? opts.error(err) : opts.error;
			updateToast(id, { ...errorOpts, state: "error", id });
		});

		return p;
	},

	dismiss: dismissToast,

	clear: (position?: GooeyPosition) =>
		store.update((prev) =>
			position ? prev.filter((t) => t.position !== position) : [],
		),
};

/* ------------------------------ Toaster Component ------------------------- */

export function Toaster({
	children,
	position = "top-right",
	offset,
	options,
}: GooeyToasterProps) {
	const [toasts, setToasts] = useState<GooeyItem[]>(store.toasts);
	const [activeId, setActiveId] = useState<string>();

	const hoverRef = useRef(false);
	const timersRef = useRef(new Map<string, number>());
	const listRef = useRef(toasts);
	const latestRef = useRef<string | undefined>(undefined);
	const handlersCache = useRef(
		new Map<
			string,
			{
				enter: MouseEventHandler<HTMLButtonElement>;
				leave: MouseEventHandler<HTMLButtonElement>;
				dismiss: () => void;
			}
		>(),
	);

	useEffect(() => {
		store.position = position;
		store.options = options;
	}, [position, options]);

	const clearAllTimers = useCallback(() => {
		for (const t of timersRef.current.values()) clearTimeout(t);
		timersRef.current.clear();
	}, []);

	const schedule = useCallback((items: GooeyItem[]) => {
		if (hoverRef.current) return;

		for (const item of items) {
			if (item.exiting) continue;
			const key = timeoutKey(item);
			if (timersRef.current.has(key)) continue;

			const dur = item.duration ?? DEFAULT_DURATION;
			if (dur === null || dur <= 0) continue;

			timersRef.current.set(
				key,
				window.setTimeout(() => dismissToast(item.id), dur),
			);
		}
	}, []);

	useEffect(() => {
		const listener: GooeyListener = (next) => setToasts(next);
		store.listeners.add(listener);
		return () => {
			store.listeners.delete(listener);
			clearAllTimers();
		};
	}, [clearAllTimers]);

	useEffect(() => {
		listRef.current = toasts;

		const toastKeys = new Set(toasts.map(timeoutKey));
		const toastIds = new Set(toasts.map((t) => t.id));
		for (const [key, timer] of timersRef.current) {
			if (!toastKeys.has(key)) {
				clearTimeout(timer);
				timersRef.current.delete(key);
			}
		}
		for (const id of handlersCache.current.keys()) {
			if (!toastIds.has(id)) handlersCache.current.delete(id);
		}

		schedule(toasts);
	}, [toasts, schedule]);

	const handleMouseEnterRef =
		useRef<MouseEventHandler<HTMLButtonElement>>(null);
	const handleMouseLeaveRef =
		useRef<MouseEventHandler<HTMLButtonElement>>(null);

	handleMouseEnterRef.current = useCallback<
		MouseEventHandler<HTMLButtonElement>
	>(() => {
		if (hoverRef.current) return;
		hoverRef.current = true;
		clearAllTimers();
	}, [clearAllTimers]);

	handleMouseLeaveRef.current = useCallback<
		MouseEventHandler<HTMLButtonElement>
	>(() => {
		if (!hoverRef.current) return;
		hoverRef.current = false;
		schedule(listRef.current);
	}, [schedule]);

	const latest = useMemo(() => {
		for (let i = toasts.length - 1; i >= 0; i--) {
			if (!toasts[i].exiting) return toasts[i].id;
		}
		return undefined;
	}, [toasts]);

	useEffect(() => {
		latestRef.current = latest;
		setActiveId(latest);
	}, [latest]);

	const getHandlers = useCallback((toastId: string) => {
		let cached = handlersCache.current.get(toastId);
		if (cached) return cached;

		cached = {
			enter: ((e) => {
				setActiveId((prev) => (prev === toastId ? prev : toastId));
				handleMouseEnterRef.current?.(e);
			}) as MouseEventHandler<HTMLButtonElement>,
			leave: ((e) => {
				setActiveId((prev) =>
					prev === latestRef.current ? prev : latestRef.current,
				);
				handleMouseLeaveRef.current?.(e);
			}) as MouseEventHandler<HTMLButtonElement>,
			dismiss: () => dismissToast(toastId),
		};

		handlersCache.current.set(toastId, cached);
		return cached;
	}, []);

	const getViewportStyle = useCallback(
		(pos: GooeyPosition): CSSProperties | undefined => {
			if (offset === undefined) return undefined;

			const o =
				typeof offset === "object"
					? offset
					: { top: offset, right: offset, bottom: offset, left: offset };

			const s: CSSProperties = {};
			const px = (v: GooeyOffsetValue) =>
				typeof v === "number" ? `${v}px` : v;

			if (pos.startsWith("top") && o.top) s.top = px(o.top);
			if (pos.startsWith("bottom") && o.bottom) s.bottom = px(o.bottom);
			if (pos.endsWith("left") && o.left) s.left = px(o.left);
			if (pos.endsWith("right") && o.right) s.right = px(o.right);

			return s;
		},
		[offset],
	);

	const byPosition = useMemo(() => {
		const map = {} as Partial<Record<GooeyPosition, GooeyItem[]>>;
		for (const t of toasts) {
			const pos = t.position ?? position;
			const arr = map[pos];
			if (arr) {
				arr.push(t);
			} else {
				map[pos] = [t];
			}
		}
		return map;
	}, [toasts, position]);

	return (
		<>
			{children}
			{GOOEY_POSITIONS.map((pos) => {
				const items = byPosition[pos];
				if (!items?.length) return null;

				const pill = pillAlign(pos);
				const expand = expandDir(pos);

				return (
					<section
						key={pos}
						data-gooey-viewport
						data-position={pos}
						aria-live="polite"
						style={getViewportStyle(pos)}
					>
						{items.map((item) => {
							const h = getHandlers(item.id);
							return (
								<Gooey
									key={item.id}
									id={item.id}
									state={item.state}
									title={item.title}
									description={item.description}
									position={pill}
									expand={expand}
									icon={item.icon}
									fill={item.fill}
									styles={item.styles}
									button={item.button}
									roundness={item.roundness}
									exiting={item.exiting}
									autoExpandDelayMs={item.autoExpandDelayMs}
									autoCollapseDelayMs={item.autoCollapseDelayMs}
									refreshKey={item.instanceId}
									canExpand={activeId === undefined || activeId === item.id}
									onMouseEnter={h.enter}
									onMouseLeave={h.leave}
									onDismiss={h.dismiss}
								/>
							);
						})}
					</section>
				);
			})}
		</>
	);
}
