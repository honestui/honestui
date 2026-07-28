import React from "react";

const values = [
  0.12, 0.22, 0.38, 0.64, 0.82, 0.48, 0.18,
  0.18, 0.34, 0.7, 0.92, 0.58, 0.3, 0.14,
  0.28, 0.56, 0.86, 0.72, 0.42, 0.2, 0.1,
  0.16, 0.36, 0.62, 0.78, 0.9, 0.52, 0.24,
];

export function HeatmapPreview() {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {values.map((opacity, index) => {
        const column = index % 7;
        const row = Math.floor(index / 7);
        return (
          <rect
            key={index}
            x={156 + column * 88}
            y={82 + row * 78}
            width="72"
            height="62"
            rx="7"
            fill="currentColor"
            fillOpacity={opacity}
          />
        );
      })}
      <rect x="286" y="412" width="328" height="10" rx="5" fill="currentColor" fillOpacity="0.12" />
      <rect x="382" y="412" width="232" height="10" rx="5" fill="currentColor" />
    </svg>
  );
}
