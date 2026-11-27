/**
 * Keeps a visual's canvas drawing inside its canvas. Model-written code
 * often draws at a fixed scale (one pixel per metre), so a fast launch flies
 * off the edge. This runs inside the sandboxed visual, before the model's
 * code, and acts like a camera: while everything drawn fits, nothing
 * changes; once something is drawn outside the canvas, the view zooms out
 * just enough to hold it and the drawing since the last full clear is
 * replayed at the new zoom, so a trail and the object at its end stay
 * together. The zoom only ever widens, and stops at a tenth, until the
 * canvas is resized.
 *
 * It wraps the 2D context: the visual's own transform is tracked (and
 * reported back by getTransform) while the canvas uses the zoom times that
 * transform. A rectangle covering the whole canvas is treated as a
 * background and never widens the view; clearing the whole canvas starts a
 * new recording. Drawing with more than MAX_OPS calls between clears stops
 * the zoom for that canvas rather than slow the page.
 *
 * Injected with Function.prototype.toString, so it must not use anything
 * from the module around it.
 */
export function canvasFit() {
  const Context = window.CanvasRenderingContext2D;
  if (!Context || !window.DOMMatrix) return;
  const proto = Context.prototype as unknown as Record<string, unknown>;
  const MAX_OPS = 20000;
  const MIN_ZOOM = 0.1;
  const MARGIN = 0.05;
  // Extra room taken when widening, so a moving object doesn't widen the view on every frame.
  const SLACK = 0.25;

  type Op = { name: string; args: unknown[]; set: boolean };
  type State = {
    model: DOMMatrix;
    zoom: DOMMatrix;
    stack: DOMMatrix[];
    ops: Op[];
    start: { model: DOMMatrix; style: Record<string, unknown>; dash: number[] };
    bounds: { x0: number; y0: number; x1: number; y1: number };
    width: number;
    height: number;
    off: boolean;
    replaying: boolean;
  };
  const states = new WeakMap<object, State>();
  const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
  const native: Record<string, (...args: unknown[]) => unknown> = {};
  const setters: Record<string, (value: unknown) => void> = {};
  const getters: Record<string, () => unknown> = {};

  for (const name of Object.getOwnPropertyNames(proto)) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, name);
    if (!descriptor) continue;
    if (typeof descriptor.value === "function") native[name] = descriptor.value;
    else if (descriptor.set && descriptor.get && name !== "canvas") {
      setters[name] = descriptor.set;
      getters[name] = descriptor.get;
    }
  }

  function snapshot(context: CanvasRenderingContext2D, state: State) {
    const style: Record<string, unknown> = {};
    for (const name in getters) style[name] = getters[name].call(context);
    state.start = { model: DOMMatrix.fromMatrix(state.model), style, dash: context.getLineDash() };
    state.ops = [];
  }

  function stateOf(context: CanvasRenderingContext2D): State {
    let state = states.get(context);
    const { width, height } = context.canvas;
    if (!state || state.width !== width || state.height !== height) {
      state = {
        model: new DOMMatrix(),
        zoom: new DOMMatrix(),
        stack: [],
        ops: [],
        start: { model: new DOMMatrix(), style: {}, dash: [] },
        bounds: { x0: 0, y0: 0, x1: width, y1: height },
        width,
        height,
        off: false,
        replaying: false,
      };
      states.set(context, state);
      contexts.set(context.canvas, context);
      snapshot(context, state);
    }
    return state;
  }

  function apply(context: CanvasRenderingContext2D, state: State) {
    native.setTransform.call(context, state.zoom.multiply(state.model));
  }

  /** Points, in canvas pixels before the zoom, that a call draws at; null for none. */
  function extent(context: CanvasRenderingContext2D, name: string, args: unknown[]): number[][] | null {
    const n = args.map(Number);
    switch (name) {
      case "moveTo":
      case "lineTo":
        return [[n[0], n[1]]];
      case "quadraticCurveTo":
        return [[n[0], n[1]], [n[2], n[3]]];
      case "bezierCurveTo":
        return [[n[0], n[1]], [n[2], n[3]], [n[4], n[5]]];
      case "arcTo":
        return [[n[0], n[1]], [n[2], n[3]]];
      case "arc":
        return [[n[0] - n[2], n[1] - n[2]], [n[0] + n[2], n[1] + n[2]]];
      case "ellipse":
        return [[n[0] - n[2], n[1] - n[3]], [n[0] + n[2], n[1] + n[3]]];
      case "rect":
      case "roundRect":
      case "fillRect":
      case "strokeRect":
        return [[n[0], n[1]], [n[0] + n[2], n[1] + n[3]]];
      case "fillText":
      case "strokeText": {
        const width = native.measureText.call(context, String(args[0])) as TextMetrics;
        return [[n[1], n[2] - width.actualBoundingBoxAscent], [n[1] + width.width, n[2] + width.actualBoundingBoxDescent]];
      }
      case "drawImage": {
        const image = args[0] as { width?: number; height?: number };
        if (args.length >= 9) return [[n[5], n[6]], [n[5] + n[7], n[6] + n[8]]];
        if (args.length >= 5) return [[n[1], n[2]], [n[1] + n[3], n[2] + n[4]]];
        return [[n[1], n[2]], [n[1] + Number(image.width ?? 0), n[2] + Number(image.height ?? 0)]];
      }
      default:
        return null;
    }
  }

  /** Widens the view to hold `points`; true when it changed. */
  function widen(state: State, name: string, points: number[][]) {
    const mapped = points
      .map(([x, y]) => state.model.transformPoint(new DOMPoint(x, y)))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Math.abs(point.x) < 1e7 && Math.abs(point.y) < 1e7);
    if (!mapped.length) return false;
    const xs = mapped.map((point) => point.x);
    const ys = mapped.map((point) => point.y);
    const box = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    // A rectangle over the whole canvas is a background, not content.
    if (/Rect$|^rect$/.test(name) && box.x0 <= 0 && box.y0 <= 0 && box.x1 >= state.width && box.y1 >= state.height) return false;
    const b = state.bounds;
    const tolerance = 1;
    if (box.x0 >= b.x0 - tolerance && box.y0 >= b.y0 - tolerance && box.x1 <= b.x1 + tolerance && box.y1 <= b.y1 + tolerance)
      return false;
    const slackX = (b.x1 - b.x0) * SLACK;
    const slackY = (b.y1 - b.y0) * SLACK;
    if (box.x0 < b.x0) b.x0 = box.x0 - slackX;
    if (box.y0 < b.y0) b.y0 = box.y0 - slackY;
    if (box.x1 > b.x1) b.x1 = box.x1 + slackX;
    if (box.y1 > b.y1) b.y1 = box.y1 + slackY;
    const spanX = (b.x1 - b.x0) * (1 + 2 * MARGIN);
    const spanY = (b.y1 - b.y0) * (1 + 2 * MARGIN);
    const zoom = Math.min(1, state.width / spanX, state.height / spanY);
    if (zoom < MIN_ZOOM) {
      state.off = true;
      return false;
    }
    // Centered across, and kept on the ground: the bottom of what was drawn stays at the bottom.
    const x = (state.width - (b.x1 - b.x0) * zoom) / 2 - b.x0 * zoom;
    const y = state.height - state.height * MARGIN * (zoom < 1 ? 1 : 0) - b.y1 * zoom;
    state.zoom = new DOMMatrix([zoom, 0, 0, zoom, zoom < 1 ? x : 0, zoom < 1 ? y : 0]);
    return true;
  }

  /** Whether a rectangle, through the visual's transform, covers the whole canvas. */
  function covers(state: State, args: unknown[]) {
    const n = args.map(Number);
    const a = state.model.transformPoint(new DOMPoint(n[0], n[1]));
    const b = state.model.transformPoint(new DOMPoint(n[0] + n[2], n[1] + n[3]));
    return (
      Math.min(a.x, b.x) <= 0 &&
      Math.min(a.y, b.y) <= 0 &&
      Math.max(a.x, b.x) >= state.width &&
      Math.max(a.y, b.y) >= state.height
    );
  }

  function replay(context: CanvasRenderingContext2D, state: State) {
    state.replaying = true;
    native.setTransform.call(context, 1, 0, 0, 1, 0, 0);
    native.clearRect.call(context, 0, 0, state.width, state.height);
    for (const name in state.start.style) {
      try {
        setters[name].call(context, state.start.style[name]);
      } catch {
        /* A property this browser rejects stays as it is. */
      }
    }
    native.setLineDash.call(context, state.start.dash);
    state.model = DOMMatrix.fromMatrix(state.start.model);
    state.stack = [];
    apply(context, state);
    for (const op of state.ops) {
      if (op.set) (context as unknown as Record<string, unknown>)[op.name] = op.args[0];
      else (context as unknown as Record<string, (...args: unknown[]) => unknown>)[op.name](...op.args);
    }
    state.replaying = false;
  }

  const TRANSFORMS: Record<string, (state: State, args: number[] & unknown[]) => void> = {
    setTransform: (state, args) => {
      state.model =
        args.length === 1 && typeof args[0] === "object" ? DOMMatrix.fromMatrix(args[0] as DOMMatrixInit) : new DOMMatrix(args.slice(0, 6) as number[]);
    },
    resetTransform: (state) => {
      state.model = new DOMMatrix();
    },
    transform: (state, args) => {
      state.model = state.model.multiply(new DOMMatrix(args.slice(0, 6) as number[]));
    },
    translate: (state, args) => {
      state.model = state.model.translate(args[0], args[1]);
    },
    scale: (state, args) => {
      state.model = state.model.scale(args[0], args[1] ?? args[0]);
    },
    rotate: (state, args) => {
      state.model = state.model.rotate((args[0] * 180) / Math.PI);
    },
  };
  // Calls that only read, or make objects, are never recorded.
  const READS = /^(get|is|measureText$|create|drawFocusIfNeeded$)/;

  for (const name in native) {
    if (READS.test(name) && name !== "getTransform") continue;
    const original = native[name];
    proto[name] = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
      const state = stateOf(this);
      if (name === "getTransform") return DOMMatrix.fromMatrix(state.model);
      if (state.off) return original.apply(this, args);
      // Clearing or filling the whole canvas starts a new picture, and
      // always covers the whole canvas, however far the view has widened.
      if ((name === "clearRect" || name === "fillRect") && covers(state, args)) {
        if (!state.replaying) {
          snapshot(this, state);
          if (name === "fillRect") state.ops.push({ name, args, set: false });
        }
        native.setTransform.call(this, 1, 0, 0, 1, 0, 0);
        original.call(this, 0, 0, state.width, state.height);
        apply(this, state);
        return undefined;
      }
      if (!state.replaying) {
        state.ops.push({ name, args, set: false });
        if (state.ops.length > MAX_OPS) {
          state.off = true;
          return original.apply(this, args);
        }
        const points = extent(this, name, args);
        if (points && widen(state, name, points)) {
          replay(this, state);
          return undefined;
        }
      }
      if (name === "save") {
        state.stack.push(DOMMatrix.fromMatrix(state.model));
        return original.apply(this, args);
      }
      if (name === "restore") {
        const result = original.apply(this, args);
        state.model = state.stack.pop() ?? state.model;
        apply(this, state);
        return result;
      }
      if (TRANSFORMS[name]) {
        TRANSFORMS[name](state, args as number[] & unknown[]);
        apply(this, state);
        return undefined;
      }
      return original.apply(this, args);
    };
  }

  // Setting a canvas's width or height resets its context, even to the same
  // size, so the view and the recording start again too.
  const Canvas = window.HTMLCanvasElement;
  for (const key of ["width", "height"] as const) {
    const descriptor = Canvas && Object.getOwnPropertyDescriptor(Canvas.prototype, key);
    if (!descriptor?.set || !descriptor.get) continue;
    const setSize = descriptor.set;
    Object.defineProperty(Canvas.prototype, key, {
      configurable: true,
      get: descriptor.get,
      set(this: HTMLCanvasElement, value: number) {
        setSize.call(this, value);
        const context = contexts.get(this);
        if (context) states.delete(context);
      },
    });
  }

  for (const name in setters) {
    const set = setters[name];
    const get = getters[name];
    Object.defineProperty(proto, name, {
      configurable: true,
      get() {
        return get.call(this);
      },
      set(this: CanvasRenderingContext2D, value: unknown) {
        const state = stateOf(this);
        if (!state.off && !state.replaying) state.ops.push({ name, args: [value], set: true });
        set.call(this, value);
      },
    });
  }
}
