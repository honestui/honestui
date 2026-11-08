"use client";
import * as React from "react";
import { MessageSquare as AskIcon, Search as SearchIcon } from "honestui/icons";
import { Button } from "../../../components/ui/button.js";
import { Checkbox } from "../../../components/ui/checkbox.js";
import { Input } from "../../../components/ui/input.js";
import { RecordsTable, type RecordsTableSort } from "../../ai/records-table.js";
import { useIsStreaming, useTriggerAction, type ActionPlan } from "../runtime/react";
import { BlockActions } from "./block-actions";
import { ChatBusyContext } from "./shared";
import { composerNear, readyComposerNear, replyBegan, setPending } from "./artifact";
import { ChatContext } from "../runtime/headless/store/ChatContext";
import { DetailedViewContext } from "../runtime/headless/store/DetailedViewContext";
import {
  array,
  groupDigits,
  isIdentifierLabel,
  looksLikeYears,
  nodeProps,
  plainNumber,
  text,
  type Props,
} from "./shared";

/** Props that carry what a generated component in a cell says. */
const TEXT_PROPS = ["text", "label", "value", "title", "content", "children"];

/**
 * What a cell says as plain text, for a question or a CSV. A component in a
 * cell, such as a tag, gives the words it shows rather than a blank.
 */
function nodeText(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(nodeText).filter(Boolean).join(", ");
  if (typeof value !== "object") return text(value);
  const props = nodeProps(value);
  for (const key of TEXT_PROPS) {
    const said = nodeText(props[key]);
    if (said) return said;
  }
  return "";
}

/**
 * A figure as a number to sort by, written plainly or as a person would:
 * "1,000", "$1,200.50", "12%"; undefined for anything else.
 */
function sortNumber(value: unknown): number | undefined {
  const plain = plainNumber(value);
  if (plain !== undefined || typeof value !== "string") return plain;
  // Commas only where they group thousands, so "1,2" is not read as 12.
  // A sign may be +, a hyphen or a true minus (−), as models write all three.
  const figure = /^([+\-\u2212]?)[$€£¥]?\s*(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?\s*%?$/.exec(value.trim());
  const sign = figure && figure[1] !== "" && figure[1] !== "+" ? "-" : "";
  return figure ? plainNumber(`${sign}${figure[2].replaceAll(",", "")}${figure[3] ?? ""}`) : undefined;
}

/** A cell that stands for a missing figure, such as "N/A" or "—". */
const PLACEHOLDER = /^(n\/?a|tbd|unknown|none|null|\?|-|–|—)$/i;

/** Each set of chosen rows is its own attachment, so asking twice keeps both. */
let nextRows = 0;

/** Past this many rows a table offers a filter. */
const FILTER_AT = 8;

/**
 * A generated table: figures aligned and grouped, years and identifiers kept
 * as written, sortable by any column, filterable once it is long, and
 * copyable or downloadable as CSV.
 */
export function GeneratedTable({
  props,
  renderNode,
}: {
  props: Props;
  renderNode: (value: unknown) => React.ReactNode;
}) {
  const streaming = useIsStreaming();
  const trigger = useTriggerAction();
  const chat = React.useContext(ChatContext);
  const views = React.useContext(DetailedViewContext);
  const frame = React.useRef<HTMLDivElement>(null);
  // Where chosen rows went, when their chip is out of sight. Each note is
  // new (an id), so the same words asked twice are said and shown again.
  const [attached, setAttached] = React.useState<{ text: string; id: number } | null>(null);
  const note = React.useRef<HTMLParagraphElement>(null);
  React.useEffect(() => {
    const region = note.current;
    if (!attached || !region) return;
    region.textContent = "";
    const frame = requestAnimationFrame(() => (region.textContent = attached.text));
    const timer = window.setTimeout(() => setAttached(null), 5000);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      region.textContent = "";
    };
  }, [attached]);

  const attachmentId = `table:${React.useId()}:`;

  // While another reply runs a question can't start; the button says so.
  const busy = React.useContext(ChatBusyContext);
  // Choosing rows to ask about, as ChatGPT lets you pick cells for a follow-up.
  const [selecting, setSelecting] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<number>>(() => new Set());
  // After rows are attached and the composer can't take the caret, it
  // returns to the button that chose them, once that is back.
  const askButton = React.useRef<HTMLButtonElement>(null);
  const refocus = React.useRef(false);
  React.useEffect(() => {
    if (selecting || !refocus.current) return;
    refocus.current = false;
    askButton.current?.focus();
  }, [selecting]);
  const [sort, setSort] = React.useState<RecordsTableSort | null>(null);
  const [query, setQuery] = React.useState("");
  const filterId = React.useId();

  const columns = array(props.columns).map(nodeProps);
  const length = Math.max(0, ...columns.map((column) => array(column.data).length));
  // A column of figures, whether or not the model marked it as one. An order
  // number, ZIP code or phone number is an identifier, not a quantity: it
  // stays as written, aligned like text.
  const numeric = columns.map(
    (column) =>
      !isIdentifierLabel(text(column.label)) &&
      (column.type === "number" ||
        (array(column.data).length > 0 &&
          array(column.data).every(
            // "1,000", "$900" and "12%" are figures too, aligned and sorted by value.
            // "N/A" or "—" marks a missing figure; it doesn't make the column text.
            (value) =>
              value == null || value === "" || sortNumber(value) !== undefined || PLACEHOLDER.test(text(value).trim()),
          ) &&
          array(column.data).some((value) => sortNumber(value) !== undefined))),
  );
  const years = columns.map((column, i) =>
    looksLikeYears(array(column.data), text(column.label), {
      leading: i === 0,
    }),
  );
  // What the table shows: its title, or else its columns.
  const title = text(props.title).trim();
  const label =
    title ||
    columns
      .map((column) => text(column.label))
      .filter(Boolean)
      .join(", ") ||
    "Table";
  const cellText = (row: number, column: number) => {
    const value = array(columns[column].data)[row];
    if (value && typeof value === "object") return nodeText(value);
    // On screen a negative figure takes a true minus sign, as wide as a plus;
    // copies and questions keep the plain hyphen (rawText).
    return numeric[column] ? groupDigits(value, years[column]).replace(/^-(?=[\d$€£¥.])/, "\u2212") : text(value);
  };

  const rawText = (row: number, column: number) => nodeText(array(columns[column].data)[row]);

  // Display order: filtered by the query, then sorted by the chosen column.
  const needle = query.trim().toLowerCase();
  let order = Array.from({ length }, (_, row) => row);
  if (needle)
    order = order.filter((row) =>
      columns.some(
        (_, column) =>
          // The screen's minus sign matches a typed hyphen.
          cellText(row, column).replace(/\u2212/g, "-").toLowerCase().includes(needle) ||
          // "37115035" finds the cell shown as 37,115,035.
          rawText(row, column).toLowerCase().includes(needle),
      ),
    );
  if (sort) {
    const column = Number(sort.columnId);
    const data = array(columns[column]?.data);
    const sign = sort.direction === "ascending" ? 1 : -1;
    order = [...order].sort((a, b) => {
      const left = data[a];
      const right = data[b];
      // Empty cells sort last in either direction.
      const leftEmpty = left == null || left === "";
      const rightEmpty = right == null || right === "";
      if (leftEmpty || rightEmpty) return Number(leftEmpty) - Number(rightEmpty);
      // Two figures compare by value, whatever the column is marked, and a
      // value that isn't one ("N/A", "$12/mo") sorts after them, so every
      // pair of rows compares the same way.
      const leftNumber = sortNumber(left);
      const rightNumber = sortNumber(right);
      if (leftNumber !== undefined && rightNumber !== undefined) {
        if (leftNumber !== rightNumber) return (leftNumber - rightNumber) * sign;
      } else if (leftNumber !== undefined || rightNumber !== undefined)
        return Number(leftNumber === undefined) - Number(rightNumber === undefined);
      return (
        // A tag sorts by the words it shows.
        nodeText(left).localeCompare(nodeText(right), undefined, {
          numeric: true,
          sensitivity: "base",
        }) * sign
      );
    });
  }

  const header = columns.map((column) => text(column.label));
  const nameColumn = Math.max(
    0,
    columns.findIndex((column, i) => !numeric[i] && !years[i] && !isIdentifierLabel(text(column.label))),
  );
  const hiddenSelected = [...selected].filter((row) => !order.includes(row)).length;
  // The header checkbox chooses every row shown, as a filter leaves them.
  const allShown = order.length > 0 && order.every((row) => selected.has(row));
  const someShown = order.some((row) => selected.has(row));
  const toggle = (row: number, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(row);
      else next.delete(row);
      return next;
    });
  /** The chosen rows as a Markdown table under a question, sent as the next message. */
  const ask = () => {
    // The chosen rows in the order shown, then any a filter now hides, in
    // the table's own order.
    const rows = [
      ...order.filter((row) => selected.has(row)),
      ...[...selected].filter((row) => !order.includes(row)).sort((a, b) => a - b),
    ];
    if (rows.length === 0) return;
    // Backslashes first, so "A\\|B" stays one cell rather than closing it early.
    const escape = (cell: string) =>
      cell.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replaceAll("\n", " ");
    const markdown = [
      `| ${header.map(escape).join(" | ")} |`,
      // Figures read as they did in the table: grouped, and aligned to the end.
      `| ${header.map((_, i) => (numeric[i] && !years[i] ? "---:" : "---")).join(" | ")} |`,
      ...rows.map(
        (row) =>
          `| ${columns
            .map((_, i) => {
              const value = array(columns[i].data)[row];
              return escape(numeric[i] && !(value && typeof value === "object") ? groupDigits(value, years[i]) : rawText(row, i));
            })
            .join(" | ")} |`,
      ),
    ].join("\n");
    // In a chat with a composer, the rows wait by it, as a passage asked
    // about does, so the reader asks their own question about them.
    if (views) {
      // They belong to this conversation and stay with it, even if a chat
      // switch unmounts the table, until they are sent or removed.
      setPending(views, `${attachmentId}${nextRows++}`, {
        // A table without a title is "the table" to the reader; its columns
        // go to the model in the rows themselves.
        title,
        text: markdown,
        rows: rows.length,
        // Named by the first text column, so a leaderboard's rows read
        // "Ada, Grace" rather than their ranks.
        names: rows.map((row) => cellText(row, nameColumn)).filter(Boolean).join(", "),
        thread: chat?.getState().selectedThreadId ?? null,
      });
      setSelecting(false);
      setSelected(new Set());
      // The caret goes to the composer when it can take it. During a reply,
      // or behind a panel covering the chat, it stays with the table, which
      // says where the rows went, since their chip can't be seen from here.
      const ready = readyComposerNear(frame.current);
      const composer = composerNear(frame.current);
      // The chip announces the rows unless a covering panel hides it (or
      // there is no composer); then the table says where they went.
      if (!composer || composer.closest("[inert]")) {
        const noun = rows.length === 1 ? "1 row" : `${rows.length} rows`;
        setAttached({ text: `${noun} will go with your next message.`, id: nextRows });
      }
      if (ready) ready.focus();
      else refocus.current = true;
      return;
    }
    const message = [
      `Tell me more about ${rows.length === 1 ? "this row" : `these ${rows.length} rows`} from the table:`,
      "",
      markdown,
    ].join("\n");
    const plan: ActionPlan = {
      steps: [{ type: "continue_conversation", message }],
    };
    // The choice is kept until a reply begins, so a failed ask can be sent
    // again. Watching starts before the send, which begins synchronously.
    if (chat) {
      const before = chat.getState().messages.length;
      let started = false;
      const unsubscribe = chat.subscribe((state) => {
        if (state.isRunning) {
          started = true;
          return;
        }
        if (!started) return;
        unsubscribe();
        if (replyBegan(state.messages.slice(before))) {
          setSelecting(false);
          setSelected(new Set());
        }
      });
      setTimeout(() => {
        if (!started && !chat.getState().isRunning) unsubscribe();
      }, 0);
    }
    trigger(message, undefined, plan);
  };
  const table = (rows: number[], choosing = false, toolbar?: React.ReactNode) => (
    <RecordsTable
      label={label}
      // While rows arrive the toolbar has nothing to offer, so no empty band shows.
      toolbar={
        streaming
          ? title && <p className="m-0 text-sm font-medium text-[var(--hui-color-foreground-base-primary)]">{title}</p>
          : toolbar
      }
      columns={[
        ...(choosing
          ? [
              {
                id: "select",
                header: "Select",
                sortable: false,
                headerContent: (
                  <Checkbox
                    size="small"
                    aria-label={needle ? "Select all rows shown" : "Select all rows"}
                    checked={allShown}
                    indeterminate={someShown && !allShown}
                    onCheckedChange={(checked) =>
                      setSelected((current) => {
                        const next = new Set(current);
                        for (const row of order) {
                          if (checked === true) next.add(row);
                          else next.delete(row);
                        }
                        return next;
                      })
                    }
                  />
                ),
              },
            ]
          : []),
        ...columns.map((column, i) => ({
          id: String(i),
          header: text(column.label),
          // Years label rows, like text; quantities line up at the end.
          align: numeric[i] && !years[i] ? ("end" as const) : undefined,
        })),
      ]}
      sort={sort}
      // Sorting a table that is still arriving would reorder rows under the reader.
      onSortChange={
        streaming || length < 2
          ? undefined
          : (columnId) =>
              setSort((current) =>
                current?.columnId !== columnId
                  ? { columnId, direction: "ascending" }
                  : current.direction === "ascending"
                    ? { columnId, direction: "descending" }
                    : null,
              )
      }
      rows={rows.map((row) => ({
        id: String(row),
        name: cellText(row, nameColumn) || String(row + 1),
        cells: Object.fromEntries([
          ...(choosing
            ? [
                [
                  "select",
                  <Checkbox
                    key="select"
                    size="small"
                    aria-label={`Select ${cellText(row, nameColumn) || `row ${row + 1}`}`}
                    checked={selected.has(row)}
                    onCheckedChange={(checked) => toggle(row, checked === true)}
                  />,
                ],
              ]
            : []),
          ...columns.map((column, i) => {
            const value = array(column.data)[row];
            return [String(i), value && typeof value === "object" ? renderNode(value) : cellText(row, i)];
          }),
        ]),
      }))}
    />
  );

  // Inside the table's card, above the columns, as a chart's controls sit in
  // its header. It wraps on a phone, so selection controls never crush the
  // filter or push the toolbar past the table's edge.
  // Said once, in the card: an empty table reads "No rows".
  const rowCount = length === 0 ? "No rows" : `${length} ${length === 1 ? "row" : "rows"}`;
  const toolbar = (
    <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2">
      {title && (
        <p className="m-0 min-w-0 text-sm font-medium text-[var(--hui-color-foreground-base-primary)]">
          {title}
          {!streaming && (
            <span className="ms-2 text-xs font-normal text-muted-foreground">
              {rowCount}
            </span>
          )}
        </p>
      )}
      {length > FILTER_AT && !streaming ? (
        <div className="relative w-full max-w-60 min-w-40 flex-1 max-sm:max-w-none">
          <label htmlFor={filterId} className="sr-only">
            Filter {label}
          </label>
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute start-2.5 top-1/2 z-1 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={filterId}
            type="search"
            size="sm"
            value={query}
            // An untitled table says its size here, where a title would.
            placeholder={title ? "Filter rows" : `Filter ${length} rows`}
            onChange={(event) => setQuery(event.target.value)}
            className="[&_input]:ps-8"
          />
        </div>
      ) : title ? null : (
        <span className="text-xs text-muted-foreground">
          {streaming ? "" : rowCount}
        </span>
      )}
      {!streaming && length > 0 && (
        <div className="ms-auto flex flex-wrap items-center justify-end gap-1 max-sm:ms-0">
          {selecting ? (
            <>
              <Button size="sm" disabled={selected.size === 0 || (busy && !views)} onClick={ask}>
                {selected.size === 0
                  ? "Choose rows to ask about"
                  : `Ask about ${selected.size} ${selected.size === 1 ? "row" : "rows"}${
                      hiddenSelected > 0 ? ` (${hiddenSelected} hidden by filter)` : ""
                    }`}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelecting(false);
                  setSelected(new Set());
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            // Named on screen: it is what sets a generated table apart, and an
            // icon alone hid it. The accessible name starts with the same words.
            <Button
              variant="ghost"
              size="sm"
              ref={askButton}
              aria-label={`Ask about rows of ${label}`}
              className="text-muted-foreground"
              onClick={() => setSelecting(true)}
            >
              <AskIcon aria-hidden="true" />
              Ask about rows
            </Button>
          )}
          <BlockActions
            label={label}
            // With a filter on, the controls say they act on the rows shown.
            scope={needle ? `${order.length} of ${length} rows of ${label}` : undefined}
            // The data as written (1200, not "1,200"), so a spreadsheet in
            // any locale reads it as a number; grouping is for the screen.
            rows={() => [header, ...order.map((row) => columns.map((_, i) => rawText(row, i)))]}
            expanded={table(order)}
          />
        </div>
      )}
    </div>
  );

  return (
    <div ref={frame} data-slot="generated-table" className="grid min-w-0 gap-2">
      {table(order, selecting, toolbar)}
      {/* Written by the effect above, so a repeated note is heard again. */}
      <p ref={note} role="status" className={attached ? "m-0 text-xs text-muted-foreground" : "sr-only"} />
      {/* Mounted with the filter, so a screen reader hears its first message. */}
      {length > FILTER_AT && !streaming && (
        <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
          <p role="status" className="m-0">
            {needle ? (order.length === 0 ? `No rows match “${query.trim()}”.` : `${order.length} of ${length} rows`) : ""}
          </p>
          {needle && order.length === 0 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => {
                setQuery("");
                document.getElementById(filterId)?.focus();
              }}
            >
              Clear filter
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
