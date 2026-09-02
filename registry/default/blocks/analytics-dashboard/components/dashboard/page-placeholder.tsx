import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * Stub for routes the starter intentionally leaves unbuilt. The Overview page
 * is the reference implementation; these keep the navigation honest without
 * shipping half-finished screens.
 */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <Empty className="mt-24">
        <EmptyHeader>
          <EmptyTitle>This page is yours to build</EmptyTitle>
          <EmptyDescription>
            The starter ships the Overview page as its reference
            implementation. Reuse its sections and data patterns to build out
            {" "}
            {title}.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" render={<Link href="/dashboard" />}>
          View overview
        </Button>
      </Empty>
    </div>
  );
}
