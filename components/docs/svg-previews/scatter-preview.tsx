import React from "react";

const points = [
  [188, 328, 13, 0.45],
  [244, 278, 19, 0.7],
  [286, 346, 11, 0.38],
  [352, 218, 25, 0.82],
  [414, 272, 15, 0.58],
  [474, 174, 31, 0.92],
  [542, 226, 18, 0.62],
  [606, 138, 23, 0.78],
  [668, 196, 14, 0.5],
  [716, 112, 20, 0.72],
] as const;

export function ScatterPreview() {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {[130, 230, 330].map((y) => (
        <path
          key={y}
          d={`M126 ${y}H774`}
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="2"
          strokeDasharray="8 10"
        />
      ))}
      {[258, 450, 642].map((x) => (
        <path
          key={x}
          d={`M${x} 76V392`}
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth="2"
          strokeDasharray="8 10"
        />
      ))}
      {points.map(([cx, cy, radius, opacity]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={radius}
          fill="currentColor"
          fillOpacity={opacity * 0.25}
          stroke="currentColor"
          strokeOpacity={opacity}
          strokeWidth="5"
        />
      ))}
    </svg>
  );
}
