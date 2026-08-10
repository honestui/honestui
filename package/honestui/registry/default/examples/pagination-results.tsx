import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/registry/default/ui/pagination";

export default function PaginationResults() {
  return (
    <div className="grid gap-3 text-center">
      <p className="text-sm text-muted-foreground">Showing 21-30 of 128</p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="/docs/components/pagination?page=2">
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/docs/components/pagination?page=3" isActive>
              3
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
