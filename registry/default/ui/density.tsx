"use client"

import * as React from "react"

type Density = "compact" | "default" | "comfortable"

const DensityContext = React.createContext<Density | undefined>(undefined)

/**
 * The density of the nearest `DensityScope` or `DensityProvider`, or
 * `undefined` outside one. A bare `data-density` attribute is CSS-only and is
 * not visible here.
 */
function useDensity(): Density | undefined {
  return React.useContext(DensityContext)
}

/**
 * Shares a density with descendants without rendering an element. Use it when
 * the element that carries `data-density` is rendered elsewhere.
 */
function DensityProvider({
  density,
  children,
}: {
  density: Density
  children: React.ReactNode
}) {
  return (
    <DensityContext.Provider value={density}>{children}</DensityContext.Provider>
  )
}

/**
 * Sets the density for a section. Popups such as menus and select lists are
 * portaled out of the section's DOM subtree, so they read the density from
 * this component rather than from CSS inheritance.
 */
function DensityScope({
  density,
  children,
  ...props
}: React.ComponentPropsWithRef<"div"> & { density: Density }) {
  return (
    <div data-slot="density-scope" data-density={density} {...props}>
      <DensityProvider density={density}>{children}</DensityProvider>
    </div>
  )
}

export { DensityProvider, DensityScope, useDensity, type Density }
