"use client";

import * as React from "react";

import { Button } from "@/registry/default/ui/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/registry/default/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/registry/default/ui/field";
import { Form } from "@/registry/default/ui/form";

const items = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "orange", label: "Orange" },
  { value: "grape", label: "Grape" },
  { value: "strawberry", label: "Strawberry" },
  { value: "mango", label: "Mango" },
  { value: "pineapple", label: "Pineapple" },
  { value: "kiwi", label: "Kiwi" },
  { value: "peach", label: "Peach" },
  { value: "pear", label: "Pear" },
];

export default function ComboboxForm() {
  const [status, setStatus] = React.useState("");
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedItem = formData.get("item");
    const itemValue =
      items.find((item) => item.label === selectedItem)?.value || selectedItem;
    setStatus(`Submitted favorite: ${itemValue || "the selected item"}.`);
  };

  return (
    <Form onSubmit={onSubmit} className="grid w-full max-w-64 gap-4">
      <Field>
        <FieldLabel>Favorite item</FieldLabel>
        <Combobox items={items} name="item" required>
          <ComboboxInput placeholder="Select an item..." />
          <ComboboxPopup>
            <ComboboxEmpty>No results found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
        <FieldError>Select an item.</FieldError>
      </Field>
      <Button type="submit">Save favorite</Button>
      <p className="text-sm text-muted-foreground" role="status">
        {status}
      </p>
    </Form>
  );
}
