"use client";

import * as React from "react";
import { Search as SearchIcon } from "honestui/icons";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/registry/default/ui/input-group";

export default function InputGroupKbd() {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="w-full max-w-sm space-y-2">
      <label className="text-sm font-medium" htmlFor="command-query">
        Search commands
      </label>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          id="command-query"
          type="search"
          placeholder="Jump to a component"
        />
        <InputGroupAddon align="inline-end">
          <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium">
            ⌘K
          </kbd>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
