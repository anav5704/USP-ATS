"use client";

import { useMemo, useState } from "react";
import { Button, SearchField, Spinner } from "@heroui/react";
import {
  BriefcaseBusinessIcon,
  CircleAlertIcon,
  SearchXIcon,
} from "lucide-react";
import { useJobFeed } from "@/components/jobs/use-job-feed";
import { JobFeedCard } from "@/components/jobs/job-feed-card";
import { JobSingleAutocomplete } from "@/components/jobs/job-single-autocomplete";
import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";
import { JOB_TYPES, USP_CAMPUSES } from "@/lib/jobs/job-constants";

const GPA_OPTIONS = ["2.0", "2.5", "3.0", "3.5", "4.0"];

export function JobFeed() {
  const { data: jobs, isPending, isError, refetch } = useJobFeed();
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [campuses, setCampuses] = useState<string[]>([]);
  const [gpaMin, setGpaMin] = useState("");

  const hasFilters =
    search.trim() !== "" || jobType !== "" || campuses.length > 0 || gpaMin !== "";

  const visibleJobs = useMemo(() => {
    if (!jobs) return jobs;
    const normalizedSearch = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        normalizedSearch === "" ||
        job.title.toLowerCase().includes(normalizedSearch) ||
        job.description.toLowerCase().includes(normalizedSearch);
      const matchesType = jobType === "" || job.jobType === jobType;
      const matchesCampus =
        campuses.length === 0 || job.campus.some((campus) => campuses.includes(campus));
      const matchesGpa = gpaMin === "" || job.gpaMin === null || job.gpaMin <= Number(gpaMin);

      return matchesSearch && matchesType && matchesCampus && matchesGpa;
    });
  }, [jobs, search, jobType, campuses, gpaMin]);

  const clearFilters = () => {
    setSearch("");
    setJobType("");
    setCampuses([]);
    setGpaMin("");
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-none">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Job Feed
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Browse available job opportunities across USP campuses.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <SearchField
              fullWidth
              value={search}
              onChange={setSearch}
              aria-label="Search jobs"
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search by title or description" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <JobSingleAutocomplete
              value={jobType}
              options={JOB_TYPES}
              placeholder="All job types"
              searchPlaceholder="Search job types"
              onChange={setJobType}
            />
            <MultiAutocomplete
              value={campuses}
              options={USP_CAMPUSES}
              placeholder="All campuses"
              searchPlaceholder="Search campuses"
              onChange={setCampuses}
            />
            <JobSingleAutocomplete
              value={gpaMin}
              options={GPA_OPTIONS}
              placeholder="Any GPA requirement"
              searchPlaceholder="Minimum GPA"
              onChange={setGpaMin}
            />
          </div>
        </div>

        {isPending ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <Spinner.Root size="lg" />
          </div>
        ) : isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <CircleAlertIcon className="size-10 text-rose-500" />
            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              Jobs could not be loaded
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Please try again.</p>
            <Button.Root className="mt-5" onPress={() => void refetch()}>
              Try again
            </Button.Root>
          </div>
        ) : jobs?.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <BriefcaseBusinessIcon className="size-10 text-zinc-400" />
            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              No job opportunities available
            </h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Check back later for new postings.
            </p>
          </div>
        ) : visibleJobs && visibleJobs.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <SearchXIcon className="size-10 text-zinc-400" />
            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              No jobs match your filters
            </h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Try adjusting your search or clearing the filters.
            </p>
            <Button.Root className="mt-5" onPress={clearFilters}>
              Clear filters
            </Button.Root>
          </div>
        ) : (
          <div>
            {jobs?.length && jobs.length > 0 && hasFilters ? (
              <p className="mb-4 text-sm text-zinc-500">
                Showing {visibleJobs?.length} of {jobs.length} jobs
              </p>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleJobs?.map((job) => (
                <JobFeedCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
