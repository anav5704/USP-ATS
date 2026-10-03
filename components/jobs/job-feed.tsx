"use client";

import { useMemo, useState } from "react";
import { Button, SearchField, Spinner } from "@heroui/react";
import {
  BriefcaseBusinessIcon,
  CircleAlertIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useJobFeed } from "@/components/jobs/use-job-feed";
import { useDebouncedValue } from "@/components/jobs/use-debounced-value";
import { JobFeedSection } from "@/components/jobs/job-feed-section";
import { JobDetailModal } from "@/components/jobs/job-detail-modal";
import { ApplyModal } from "@/components/applications/apply-modal";
import { useMyApplications } from "@/components/applications/use-my-applications";
import { blocksReapplication } from "@/lib/applications/application-rules";
import type { StudentJobListItem } from "@/lib/jobs/job-schema";
import {
  JobFeedFilterModal,
  type JobFeedFilters,
} from "@/components/jobs/job-feed-filter-modal";

export function JobFeed() {
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [campuses, setCampuses] = useState<string[]>([]);
  const [gpaMin, setGpaMin] = useState("");
  const [degrees, setDegrees] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
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
  const { data: sections, isPending, isError, refetch } = useJobFeed(filters);
  const { data: applications } = useMyApplications();
  const [selectedJob, setSelectedJob] = useState<StudentJobListItem | null>(null);
  const [applyJob, setApplyJob] = useState<StudentJobListItem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { campusMatchedJobs, degreeMatchedJobs, otherJobs, allJobs } = useMemo(() => {
    const campusMatchedJobs = sections?.campusMatchedJobs ?? [];
    const degreeMatchedJobs = sections?.degreeMatchedJobs ?? [];
    const otherJobs = sections?.otherJobs ?? [];
    const seen = new Set<string>();
    const allJobs: StudentJobListItem[] = [];
    for (const job of [...campusMatchedJobs, ...degreeMatchedJobs, ...otherJobs]) {
      if (seen.has(job.id)) continue;
      seen.add(job.id);
      allJobs.push(job);
    }
    return { campusMatchedJobs, degreeMatchedJobs, otherJobs, allJobs };
  }, [sections]);

  const appliedJobIds = useMemo(
    () =>
      new Set(
        (applications ?? [])
          .filter((application) => blocksReapplication(application.status))
          .map((application) => application.job.id)
      ),
    [applications]
  );

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
    <div className="p-3">
      <div className="mx-auto max-w-none">
        <div className="sticky top-3 z-10 mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
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
          <Button.Root
            onPress={() => setFiltersOpen(true)}
            className="shrink-0 rounded-field border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-tertiary"
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
              Jobs could not be loaded
            </h2>
            <p className="mt-1 text-sm text-muted">Please try again.</p>
            <Button.Root className="mt-5" onPress={() => void refetch()}>
              Try Again
            </Button.Root>
          </div>
        ) : allJobs.length === 0 && !hasFilters ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
            <BriefcaseBusinessIcon className="size-10 text-muted" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              No job opportunities available
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Check back later for new postings.
            </p>
          </div>
        ) : allJobs.length === 0 ? (
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
        ) : (
          <div>
            {allJobs.length > 0 && hasFilters ? (
              <p className="mb-3 text-sm text-muted">
                Showing {allJobs.length} jobs
              </p>
            ) : null}
            <div className="space-y-8">
              <JobFeedSection
                title="Opportunities Near You"
                jobs={campusMatchedJobs}
                onJobPress={setSelectedJob}
              />
              <JobFeedSection
                title="Opportunities Matching Your Qualification"
                jobs={degreeMatchedJobs}
                onJobPress={setSelectedJob}
              />
              <JobFeedSection
                title="Other Opportunities"
                jobs={otherJobs}
                onJobPress={setSelectedJob}
              />
            </div>
          </div>
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
