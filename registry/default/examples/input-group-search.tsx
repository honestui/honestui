"use client";

import * as React from "react";
import { Search as SearchIcon, X as XIcon } from "honestui/icons";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/registry/default/ui/input-group";

export default function InputGroupSearch() {
  const [query, setQuery] = React.useState("");

  return (
    <div className="w-full max-w-sm space-y-2">
      <label className="text-sm font-medium" htmlFor="component-search">
        Search components
      </label>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id="component-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try “dialog”"
          type="search"
        />
        {query && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Clear search"
              onClick={() => setQuery("")}
              size="icon-xs"
            >
              <XIcon aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {query ? `Current query: ${query}` : "Enter a component name."}
      </p>
    </div>
  );
}
