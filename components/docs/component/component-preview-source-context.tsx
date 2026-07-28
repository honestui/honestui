"use client";

import * as React from "react";

interface ComponentPreviewContextValue {
  onSourceChange: (source: string) => void;
  playgroundPortal: HTMLDivElement | null;
}

const ComponentPreviewSourceContext =
  React.createContext<ComponentPreviewContextValue | null>(null);

export function ComponentPreviewSourceProvider({
  children,
  onSourceChange,
  playgroundPortal,
}: {
  children: React.ReactNode;
  onSourceChange: (source: string) => void;
  playgroundPortal: HTMLDivElement | null;
}) {
  const value = React.useMemo(
    () => ({ onSourceChange, playgroundPortal }),
    [onSourceChange, playgroundPortal],
  );

  return (
    <ComponentPreviewSourceContext.Provider value={value}>
      {children}
    </ComponentPreviewSourceContext.Provider>
  );
}

export function useComponentPreviewSource(source: string) {
  const context = React.useContext(ComponentPreviewSourceContext);
  const onSourceChange = context?.onSourceChange;

  React.useEffect(() => {
    onSourceChange?.(source);
  }, [onSourceChange, source]);
}

export function useComponentPreviewPlaygroundPortal() {
  return React.useContext(ComponentPreviewSourceContext)?.playgroundPortal ?? null;
}
