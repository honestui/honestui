import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/registry/default/ui/input-group";

export default function InputGroupUrl() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <label className="text-sm font-medium" htmlFor="project-slug">
        Project URL
      </label>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>honestui.com/</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id="project-slug"
          name="slug"
          placeholder="my-project"
          spellCheck={false}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.tsx</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <p className="text-sm text-muted-foreground">
        Prefixes and suffixes add context; the input value remains only the
        slug.
      </p>
    </div>
  );
}
