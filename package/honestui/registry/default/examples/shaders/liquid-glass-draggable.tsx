"use client";

import * as React from "react";
import { Bold, GripHorizontal, Italic, Link, Sparkles, Underline } from "honestui/icons";
import { LiquidGlass } from "honestui/shaders";

const STEP = 16;

// Drag the toolbar across the photo, or focus the handle and use the arrow
// keys. The edge of the glass bends the scene as it passes over it. The
// photo is bright in either theme, so the toolbar uses dark text throughout.
export default function LiquidGlassDraggable() {
  const areaRef = React.useRef<HTMLDivElement>(null);
  const glassRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [pressed, setPressed] = React.useState<Record<string, boolean>>({ bold: true });

  const clampPosition = React.useCallback((x: number, y: number) => {
    const area = areaRef.current;
    const glass = glassRef.current;
    if (!area || !glass) return { x, y };
    const maxX = Math.max(0, (area.clientWidth - glass.offsetWidth) / 2 - 12);
    const maxY = Math.max(0, (area.clientHeight - glass.offsetHeight) / 2 - 12);
    return { x: Math.min(Math.max(x, -maxX), maxX), y: Math.min(Math.max(y, -maxY), maxY) };
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, startX: position.x, startY: position.y };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = drag.current;
    if (!start) return;
    setPosition(clampPosition(start.startX + event.clientX - start.x, start.startY + event.clientY - start.y));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-STEP, 0],
      ArrowRight: [STEP, 0],
      ArrowUp: [0, -STEP],
      ArrowDown: [0, STEP],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setPosition((current) => clampPosition(current.x + move[0], current.y + move[1]));
  };

  const tools = [
    { id: "bold", label: "Bold", icon: Bold },
    { id: "italic", label: "Italic", icon: Italic },
    { id: "underline", label: "Underline", icon: Underline },
    { id: "link", label: "Link", icon: Link },
  ];

  return (
    <div
      ref={areaRef}
      className="relative grid h-80 w-full place-items-center overflow-hidden rounded-xl bg-[#ebe6de] sm:h-96"
    >
      <img
        alt=""
        src="https://images.unsplash.com/photo-1553933420-77617bac448e?auto=format&fit=crop&w=1600&q=85"
        className="absolute inset-0 size-full object-cover"
      />
      <div style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
        <LiquidGlass ref={glassRef} radius={22} bezel={18} refraction={0.7} dispersion={0.3} tint="rgba(255, 255, 255, 0.24)">
          <div
            role="toolbar"
            aria-label="Text formatting"
            className="flex items-center gap-1 p-1.5 text-neutral-950"
          >
            <button
              type="button"
              aria-label="Move toolbar"
              title="Drag, or use the arrow keys"
              onKeyDown={onKeyDown}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
              className="grid size-9 cursor-grab touch-none place-items-center rounded-[14px] opacity-70 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current active:cursor-grabbing"
            >
              <GripHorizontal className="size-4" />
            </button>
            {tools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={Boolean(pressed[id])}
                onClick={() => setPressed((current) => ({ ...current, [id]: !current[id] }))}
                className="grid size-9 place-items-center rounded-[14px] outline-none transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-current aria-pressed:bg-white/55"
              >
                <Icon className="size-4" />
              </button>
            ))}
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-current opacity-20" />
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-[14px] px-3 text-[13px] font-medium outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-current"
            >
              <Sparkles className="size-4" />
              Rewrite
            </button>
          </div>
        </LiquidGlass>
      </div>
    </div>
  );
}
