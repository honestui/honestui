"use client";
import * as React from "react";
import {
  DataGrid,
  type DataGridColumn,
} from "@/registry/default/product/data-grid/data-grid";
import { Button } from "@/registry/default/ui/button";
import { Input } from "@/registry/default/ui/input";
import {
  useStateField,
  useIsStreaming,
  useTriggerAction,
  useFormName,
} from "../runtime/react";
import { ChatBusyContext, array, record, text, type Props } from "./shared";
export function GeneratedEditableTable({ props }: { props: Props }) {
  const busy = React.useContext(ChatBusyContext);
  const field = useStateField<unknown>(text(props.name));
  const streaming = useIsStreaming();
  const trigger = useTriggerAction();
  const formName = useFormName();
  const source = array(field.value ?? props.data).map(record);
  const definitions = array(props.columns).map(record);
  const rows = source.map((row) =>
    Object.fromEntries([
      ["id", row.id],
      ...definitions.map((column, i) => [
        text(column.key),
        array(row.values)[i],
      ]),
    ]),
  );
  const columns: DataGridColumn<Props>[] = definitions.map((column) => ({
    accessorKey: text(column.key),
    header: text(column.header),
    // Figures line up at the end, as in a read-only table.
    ...(column.type === "number" && { align: "right" as const }),
    editable: !streaming,
    edit: ({ value, onChange, onCommit }) =>
      column.type === "select" ? (
        <select
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onCommit();
            }
          }}
          aria-label={text(column.header)}
          value={text(value)}
          onChange={(event) => onChange(event.target.value)}
          // Drawn like the text field beside it, not the browser's default.
          className="h-[var(--hui-control-height-sm,var(--hui-space-8))] w-full min-w-0 rounded-[var(--hui-radius-2)] border-[0.5px] border-[var(--hui-color-border-field,var(--hui-color-border-base-tertiary))] bg-[var(--hui-color-background-field,var(--hui-color-background-base-primary))] px-2 text-[13px] text-[var(--hui-color-foreground-base-primary)] outline-none focus-visible:border-[var(--hui-color-border-accent-emphasis)] focus-visible:shadow-[var(--hui-focus-ring-field)]"
        >
          {array(column.options)
            .map(record)
            .map((option) => (
              <option key={text(option.value)} value={text(option.value)}>
                {text(option.label)}
              </option>
            ))}
        </select>
      ) : (
        <Input
          size="sm"
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onCommit();
            }
          }}
          aria-label={text(column.header)}
          type={
            column.type === "number"
              ? "number"
              : column.type === "date-single"
                ? "date"
                : column.type === "url"
                  ? "url"
                  : "text"
          }
          value={text(value)}
          onChange={(event) =>
            onChange(
              column.type === "number"
                ? Number(event.target.value)
                : event.target.value,
            )
          }
        />
      ),
  }));
  return (
    <div className="grid gap-3 [--table-cell-color:var(--hui-color-foreground-base-primary)]">
      <DataGrid
        data={rows}
        columns={columns}
        caption={text(props.name) || "Editable table"}
        getRowId={(row) => text(row.id)}
        onCellEdit={({ row: editedRow, columnId, value }) => {
          field.setValue(
            source.map((row) =>
              text(row.id) === editedRow.id
                ? {
                    ...row,
                    values: definitions.map((column, i) =>
                      text(column.key) === columnId
                        ? value
                        : array(row.values)[i],
                    ),
                  }
                : row,
            ),
          );
        }}
      />
      <Button
        className="justify-self-start"
        // Saving sends the table to the assistant, which waits while another reply runs.
        disabled={streaming || busy || field.value === undefined}
        onClick={() => trigger("Save Changes", formName)}
      >
        Save changes
      </Button>
    </div>
  );
}
