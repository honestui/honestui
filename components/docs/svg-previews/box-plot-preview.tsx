import React from "react";

const boxes = [
  { x: 176, low: 330, q3: 172, median: 232, high: 106 },
  { x: 316, low: 356, q3: 206, median: 264, high: 128 },
  { x: 456, low: 302, q3: 136, median: 202, high: 82 },
  { x: 596, low: 342, q3: 190, median: 244, high: 118 },
] as const;

export function BoxPlotPreview() {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {[126, 206, 286, 366].map((y) => (
        <path
          key={y}
          d={`M104 ${y}H796`}
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="2"
          strokeDasharray="8 10"
        />
      ))}
      {boxes.map(({ x, low, q3, median, high }, index) => {
        const q1 = low - 54;
        return (
          <g key={x}>
            <path
              d={`M${x + 42} ${high}V${q3}M${x + 42} ${q1}V${low}M${x + 18} ${high}H${x + 66}M${x + 18} ${low}H${x + 66}`}
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <rect
              x={x}
              y={q3}
              width="84"
              height={q1 - q3}
              rx="5"
              fill="currentColor"
              fillOpacity={0.16 + index * 0.05}
              stroke="currentColor"
              strokeWidth="7"
            />
            <path d={`M${x + 2} ${median}H${x + 82}`} stroke="currentColor" strokeWidth="7" />
          </g>
        );
      })}
    </svg>
  );
}
