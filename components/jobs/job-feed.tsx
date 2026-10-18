"use client";

import { useMemo, useState } from "react";
import { Button, SearchField, Spinner, Tabs } from "@heroui/react";
import {
  BriefcaseBusinessIcon,
  CircleAlertIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useJobFeed } from "@/components/jobs/use-job-feed";
import { useDebouncedValue } from "@/components/jobs/use-debounced-value";
import { JobFeedCard } from "@/components/jobs/job-feed-card";
import { JobDetailModal } from "@/components/jobs/job-detail-modal";
import { ApplyModal } from "@/components/applications/apply-modal";
import { useInfiniteScroll } from "@/components/ui/use-infinite-scroll";
import { InfiniteScrollLoader } from "@/components/ui/infinite-scroll-loader";
import { IconTooltip } from "@/components/ui/icon-tooltip";
import type { FeedGroup } from "@/lib/jobs/job-list-queries";
import type { StudentJobListItem } from "@/lib/jobs/job-schema";
import {
  JobFeedFilterModal,
  type JobFeedFilters,
} from "@/components/jobs/job-feed-filter-modal";

const TABS: { id: FeedGroup; label: string }[] = [
  { id: "campus", label: "Near You" },
  { id: "degree", label: "Matching Qualification" },
  { id: "other", label: "Other Opportunities" },
];

export function JobFeed() {
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [campuses, setCampuses] = useState<string[]>([]);
  const [gpaMin, setGpaMin] = useState("");
  const [degrees, setDegrees] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [tab, setTab] = useState<FeedGroup>("campus");
  const debouncedSearch = useDebouncedValue(search, 300);
  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      jobType,
      campuses,
      gpaMin,
      degrees,
      skills,
    }),
    [debouncedSearch, jobType, campuses, gpaMin, degrees, skills]
  );
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useJobFeed(filters, tab);
  const [selectedJob, setSelectedJob] = useState<StudentJobListItem | null>(null);
  const [applyJob, setApplyJob] = useState<StudentJobListItem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const jobs = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.items),
    [data]
  );
  const totals = data?.pages[0]?.totals ?? { campus: 0, degree: 0, other: 0 };
  const total = totals[tab];
  const appliedJobIds = useMemo(
    () => new Set(data?.pages[0]?.appliedJobIds ?? []),
    [data]
  );
  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage: () => void fetchNextPage(),
  });

  const hasFilters =
    search.trim() !== "" ||
    jobType !== "" ||
    campuses.length > 0 ||
    gpaMin !== "" ||
    degrees.length > 0 ||
    skills.length > 0;

  const activeFilterCount =
    (jobType !== "" ? 1 : 0) +
    (campuses.length > 0 ? 1 : 0) +
    (gpaMin !== "" ? 1 : 0) +
    (degrees.length > 0 ? 1 : 0) +
    (skills.length > 0 ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setJobType("");
    setCampuses([]);
    setGpaMin("");
    setDegrees([]);
    setSkills([]);
  };

  const applyFilters = (filters: JobFeedFilters) => {
    setJobType(filters.jobType);
    setCampuses(filters.campuses);
    setGpaMin(filters.gpaMin);
    setDegrees(filters.degrees);
    setSkills(filters.skills);
  };

  return (
    <div className="p-2 sm:p-3">
      <div className="mx-auto max-w-none">
        {isPending ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-surface">
            <Spinner.Root size="lg" className="text-foreground" />
          </div>
        ) : isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <CircleAlertIcon className="size-10 text-danger" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              Jobs could not be loaded
            </h2>
            <p className="mt-1 text-sm text-muted">Please try again.</p>
            <Button.Root className="mt-5" onPress={() => void refetch()}>
              Try Again
            </Button.Root>
          </div>
        ) : (
          <Tabs.Root
            selectedKey={tab}
            onSelectionChange={(key) => setTab(String(key) as FeedGroup)}
            className="gap-3"
          >
            <div className="sticky top-3 z-10 space-y-3 rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <SearchField
                    fullWidth
                    value={search}
                    onChange={setSearch}
                    aria-label="Search jobs"
                  >
                    <SearchField.Group className="border-border">
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder="Search by title or description" />
                      <SearchField.ClearButton />
                    </SearchField.Group>
                  </SearchField>
                </div>
                <IconTooltip
                  label="Filter by campus, job type, GPA, degree or skills"
                  className="w-full sm:w-auto"
                >
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
                </IconTooltip>
              </div>
              <Tabs.List aria-label="Job groups" className="w-full overflow-x-auto">
                {TABS.map((entry) => (
                  <Tabs.Tab
                    key={entry.id}
                    id={entry.id}
                    className="whitespace-nowrap rounded-field px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground data-[selected=true]:bg-foreground data-[selected=true]:text-background"
                  >
                    {entry.label} ({totals[entry.id]})
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </div>
            {TABS.map((entry) => (
              <Tabs.Panel key={entry.id} id={entry.id} className="mt-0 p-0">
                {entry.id === tab && total === 0 && !hasFilters ? (
                  <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
                    <BriefcaseBusinessIcon className="size-10 text-muted" />
                    <h2 className="mt-4 text-xl font-semibold text-foreground">
                      No job opportunities available
                    </h2>
                    <p className="mt-1 max-w-sm text-sm text-muted">
                      Check back later for new postings.
                    </p>
                  </div>
                ) : entry.id === tab && total === 0 ? (
                  <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
                    <SearchXIcon className="size-10 text-muted" />
                    <h2 className="mt-4 text-xl font-semibold text-foreground">
                      No jobs match your filters
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
                ) : entry.id === tab ? (
                  <div>
                    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {jobs.map((job) => (
                        <JobFeedCard
                          key={job.id}
                          job={job}
                          hasApplied={appliedJobIds.has(job.id)}
                          onPress={() => setSelectedJob(job)}
                        />
                      ))}
                    </div>
                    <div ref={sentinelRef} aria-hidden="true" />
                    <InfiniteScrollLoader isFetching={isFetchingNextPage} />
                  </div>
                ) : null}
              </Tabs.Panel>
            ))}
          </Tabs.Root>
        )}
      </div>
      {filtersOpen ? (
        <JobFeedFilterModal
          filters={{ jobType, campuses, gpaMin, degrees, skills }}
          onApply={applyFilters}
          onOpenChange={setFiltersOpen}
        />
      ) : null}
      {selectedJob ? (
        <JobDetailModal
          job={selectedJob}
          isOpen
          onOpenChange={(open) => {
            if (!open) setSelectedJob(null);
          }}
          hasApplied={appliedJobIds.has(selectedJob.id)}
          onApply={() => {
            setApplyJob(selectedJob);
            setSelectedJob(null);
          }}
        />
      ) : null}
      {applyJob ? (
        <ApplyModal
          job={applyJob}
          isOpen
          onOpenChange={(open) => {
            if (!open) setApplyJob(null);
          }}
        />
      ) : null}
    </div>
  );
}
