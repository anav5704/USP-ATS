"use client";

import { Pagination } from "@heroui/react";
import { pageCount } from "@/lib/pagination";

function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const windowed = new Set<number>([
    1,
    current - 1,
    current,
    current + 1,
    total,
  ]);
  const pages = [...windowed]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const withGaps: (number | "gap")[] = [];
  for (const page of pages) {
    const last = withGaps[withGaps.length - 1];
    if (typeof last === "number" && page - last > 1) withGaps.push("gap");
    withGaps.push(page);
  }
  return withGaps;
}

export function TablePagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const totalPages = pageCount(total, pageSize);
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <Pagination size="sm" className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Pagination.Summary className="max-w-full whitespace-normal text-sm">
        {start} to {end} of {total} results
      </Pagination.Summary>
      <Pagination.Content className="max-w-full flex-wrap justify-center sm:w-auto sm:justify-end">
          <Pagination.Item>
            <Pagination.Previous
              isDisabled={page === 1}
              onPress={() => onChange(Math.max(1, page - 1))}
            >
              <Pagination.PreviousIcon />
              Prev
            </Pagination.Previous>
          </Pagination.Item>
          {pageWindow(page, totalPages).map((item, index) =>
            item === "gap" ? (
              <Pagination.Item key={`gap-${index}`}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={item}>
                <Pagination.Link
                  isActive={item === page}
                  onPress={() => onChange(item)}
                >
                  {item}
                </Pagination.Link>
              </Pagination.Item>
            )
          )}
          <Pagination.Item>
            <Pagination.Next
              isDisabled={page === totalPages}
              onPress={() => onChange(Math.min(totalPages, page + 1))}
            >
              Next
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
    </Pagination>
  );
}
