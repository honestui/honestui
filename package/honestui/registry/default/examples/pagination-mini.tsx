import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/registry/default/ui/pagination"

export default function PaginationMini() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
        <PaginationItem><PaginationNext href="#" /></PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
