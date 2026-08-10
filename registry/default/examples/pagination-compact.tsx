import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/registry/default/ui/pagination";

export default function PaginationCompact() {
  return (
    <Pagination>
      <PaginationContent>
        {[1, 2, 3, 4].map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href={`/docs/components/pagination?page=${page}`}
              isActive={page === 3}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
      </PaginationContent>
    </Pagination>
  );
}
