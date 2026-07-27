"use client"

import * as React from "react"

type FormProps = React.ComponentProps<"form"> & {
  errors?: Record<string, string | string[]>
  onClearErrors?: (errors: Record<string, string | string[]>) => void
}

function Form({ errors, onClearErrors, ...props }: FormProps) {
  return <form {...props} />
}

export { Form }
