import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/registry/default/ui/pagination";

export default function PaginationMini() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="/docs/components/pagination?page=2" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="/docs/components/pagination?page=4" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
