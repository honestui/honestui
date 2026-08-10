import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/registry/default/ui/input-group";

export default function InputGroupTextareaExample() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <label className="text-sm font-medium" htmlFor="release-note">
        Release note
      </label>
      <InputGroup>
        <InputGroupTextarea
          id="release-note"
          maxLength={180}
          placeholder="Describe what changed"
          rows={4}
        />
        <InputGroupAddon align="block-end" className="justify-end border-t">
          <InputGroupText>180 characters maximum</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
