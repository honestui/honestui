"use client";
import { ChevronRight as ChevronRightIcon } from "honestui/icons";
import { disclosureChevron, disclosureSummary } from "./shared";

/**
 * The figures behind a chart, one disclosure away: exact values for anyone
 * who wants them, and the chart's content for anyone who cannot see it. The
 * first column names each row; the rest are values, aligned to the end.
 */
export function ChartDataTable({
  columns,
  rows,
  label,
}: {
  columns: string[];
  rows: string[][];
  /** The chart's caption, so several "View data" controls can be told apart. */
  label?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <details data-slot="generated-chart-data" className="group text-sm">
      <summary className={disclosureSummary}>
        <ChevronRightIcon aria-hidden="true" className={disclosureChevron} />
        View data
        {label && <span className="sr-only">{` for ${label}`}</span>}
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--hui-color-border-base-primary)] text-start text-xs text-muted-foreground">
              {columns.map((column, i) => (
                <th
                  key={i}
                  scope="col"
                  // A <th> centres by default; the first column labels rows, at the start.
                  className={i === 0 ? "py-1.5 pe-4 text-start font-medium" : "py-1.5 ps-4 text-end font-medium"}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[var(--hui-color-border-base-primary)] last:border-b-0">
                {row.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="py-1.5 pe-4 text-start font-normal">
                      {cell}
                    </th>
                  ) : (
                    <td key={j} className="py-1.5 ps-4 text-end">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
