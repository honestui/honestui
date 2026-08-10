"use client"

import * as React from "react"

type FormProps = React.ComponentProps<"form">

function Form(props: FormProps) {
  return <form {...props} />
}

export { Form }
