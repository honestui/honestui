import path from "node:path"
import scss from "postcss-scss"

export function getCssSyntax(filePath: string | undefined) {
  return filePath && path.extname(filePath).toLowerCase() === ".scss"
    ? scss
    : undefined
}

export function preserveCssLineEndings(input: string, output: string) {
  return input.includes("\r\n") ? output.replace(/\r?\n/g, "\r\n") : output
}
