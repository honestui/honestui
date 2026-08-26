import { Button } from "@/registry/default/ui/button";

export default function ButtonLongText() {
  return (
    <div className="flex max-w-72 flex-col items-center gap-3">
      <Button className="max-w-full">
        <span className="truncate">
          Move all selected conversations to the archive folder
        </span>
      </Button>
      <Button variant="secondary">Archive selection</Button>
    </div>
  );
}
