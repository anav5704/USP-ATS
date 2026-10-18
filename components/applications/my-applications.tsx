"use client";

import { useMemo, useState } from "react";
import { Button, SearchField, Spinner } from "@heroui/react";
import {
  CircleAlertIcon,
  ClipboardListIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useMyApplications } from "@/components/applications/use-my-applications";
import { useDebouncedValue } from "@/components/jobs/use-debounced-value";
import { useInfiniteScroll } from "@/components/ui/use-infinite-scroll";
import { InfiniteScrollLoader } from "@/components/ui/infinite-scroll-loader";
import { ApplicationCard } from "@/components/applications/application-card";
import { ApplicationDetailModal } from "@/components/applications/application-detail-modal";
import {
  ApplicationFilterModal,
  EMPTY_APPLICATION_FILTERS,
  type ApplicationFilters,
} from "@/components/applications/application-filter-modal";
import type { ApplicationListItem } from "@/lib/applications/application-schema";

export function MyApplications() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ApplicationFilters>(
    EMPTY_APPLICATION_FILTERS
  );
  const debouncedSearch = useDebouncedValue(search, 300);
  const serverFilters = useMemo(
    () => ({ search: debouncedSearch.trim(), status: filters.status }),
    [debouncedSearch, filters.status]
  );
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyApplications(serverFilters);
  const [selected, setSelected] = useState<ApplicationListItem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const applications = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.items),
    [data]
  );
  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage: () => void fetchNextPage(),
  });

  const selectedApplication = selected
    ? (applications.find((application) => application.id === selected.id) ??
      selected)
    : null;

  const hasFilters =
    search.trim() !== "" || filters.status !== "";

  const activeFilterCount = filters.status !== "" ? 1 : 0;

  const clearFilters = () => {
    setSearch("");
    setFilters(EMPTY_APPLICATION_FILTERS);
  };

  return (
    <div className="p-2 sm:p-3">
      <div className="mx-auto max-w-none">
        <div className="sticky top-3 z-10 mb-3 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SearchField
              fullWidth
              value={search}
              onChange={setSearch}
              aria-label="Search applications"
            >
              <SearchField.Group className="border-border">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search by job title or department" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
          <Button.Root
            onPress={() => setFiltersOpen(true)}
            className="w-full shrink-0 rounded-field border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-tertiary sm:w-auto"
          >
            <SlidersHorizontalIcon className="size-4" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                {activeFilterCount}
              </span>
            ) : null}
          </Button.Root>
        </div>

        {isPending ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-surface">
            <Spinner.Root size="lg" className="text-foreground" />
          </div>
        ) : isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <CircleAlertIcon className="size-10 text-danger" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              Applications could not be loaded
            </h2>
            <p className="mt-1 text-sm text-muted">Please try again.</p>
            <Button.Root className="mt-5" onPress={() => void refetch()}>
              Try Again
            </Button.Root>
          </div>
        ) : applications.length === 0 && !hasFilters ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <ClipboardListIcon className="size-10 text-muted" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              No applications yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Apply to jobs from the Job Feed and they will appear here.
            </p>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <SearchXIcon className="size-10 text-muted" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              No applications match your filters
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Try adjusting your search or clearing the filters.
            </p>
            <Button.Root
              className="mt-5 rounded-field border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-tertiary"
              onPress={clearFilters}
            >
              Clear Filters
            </Button.Root>
          </div>
        ) : (
          <div>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
              {applications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onPress={() => setSelected(application)}
                />
              ))}
            </div>
            <div ref={sentinelRef} aria-hidden="true" />
            <InfiniteScrollLoader isFetching={isFetchingNextPage} />
          </div>
        )}
      </div>
      {selectedApplication ? (
        <ApplicationDetailModal
          application={selectedApplication}
          isOpen
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      ) : null}
      {filtersOpen ? (
        <ApplicationFilterModal
          filters={filters}
          onApply={setFilters}
          onOpenChange={setFiltersOpen}
        />
      ) : null}
    </div>
  );
}
