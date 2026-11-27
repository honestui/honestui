import { Box as BoxIcon } from "honestui/icons";
import {
  ClaudeAI,
  Deepseek,
  GoogleIcon,
  Grok,
  Meta,
  OpenAI,
} from "honestui/logos";

// A model's maker, read from the start of its name. Ollama names carry a
// registry path and a tag, as in "library/gemma4:31b". Makers that Honest UI
// has no logo for, such as Mistral and Qwen, get the plain box.
const makers: [pattern: RegExp, Logo: typeof OpenAI][] = [
  [/^(gpt|o\d|chatgpt|openai)/, OpenAI],
  [/^(gemma|gemini|codegemma)/, GoogleIcon],
  [/^(llama|codellama)/, Meta],
  [/^claude/, ClaudeAI],
  [/^deepseek/, Deepseek],
  [/^grok/, Grok],
];

/** The logo of a model's maker, or a plain box when there is none for it. */
export function ModelIcon({ model }: { model: string }) {
  const name = model.toLowerCase().split("/").at(-1) ?? "";
  const Logo = makers.find(([pattern]) => pattern.test(name))?.[1];
  return Logo ? (
    <Logo aria-hidden="true" className="size-4 shrink-0" />
  ) : (
    <BoxIcon aria-hidden="true" className="size-4 shrink-0" />
  );
}
