"use client";
import * as React from "react";
import {
  DataGrid,
  type DataGridColumn,
} from "../../../components/product/data-grid/data-grid.js";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import {
  useStateField,
  useIsStreaming,
  useTriggerAction,
  useFormName,
} from "../runtime/react";
import { array, record, text, type Props } from "./shared";
export function GeneratedEditableTable({ props }: { props: Props }) {
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
    <div className="grid gap-3">
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
        disabled={streaming || field.value === undefined}
        onClick={() => trigger("Save Changes", formName)}
      >
        Save changes
      </Button>
    </div>
  );
}
