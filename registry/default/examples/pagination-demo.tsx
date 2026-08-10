"use client";

import * as React from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/registry/default/ui/pagination";

export default function PaginationDemo() {
  const [page, setPage] = React.useState(2);
  const pageHref = (nextPage: number) =>
    `/docs/components/pagination?page=${nextPage}`;
  const navigate =
    (nextPage: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setPage(nextPage);
    };

  return (
    <Pagination aria-label="Project results">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={page === 1}
            href={pageHref(Math.max(1, page - 1))}
            onClick={page === 1 ? undefined : navigate(page - 1)}
          />
        </PaginationItem>
        {[1, 2, 3].map((item) => (
          <PaginationItem key={item}>
            <PaginationLink
              href={pageHref(item)}
              isActive={page === item}
              onClick={navigate(item)}
            >
              {item}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            aria-disabled={page === 3}
            href={pageHref(Math.min(3, page + 1))}
            onClick={page === 3 ? undefined : navigate(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
