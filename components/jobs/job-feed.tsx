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
import { JobFeedSection } from "@/components/jobs/job-feed-section";
import { JobDetailModal } from "@/components/jobs/job-detail-modal";
import type { StudentJobListItem } from "@/lib/jobs/job-schema";
import { useProfile } from "@/components/profile/use-profile";
import {
  JobFeedFilterModal,
  type JobFeedFilters,
} from "@/components/jobs/job-feed-filter-modal";

export function JobFeed() {
  const { data: jobs, isPending, isError, refetch } = useJobFeed();
  const { data: profile } = useProfile();
  const [selectedJob, setSelectedJob] = useState<StudentJobListItem | null>(null);
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [campuses, setCampuses] = useState<string[]>([]);
  const [gpaMin, setGpaMin] = useState("");
  const [degrees, setDegrees] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      const gpaValue = Number(gpaMin);
      const matchesGpa =
        gpaMin === "" ||
        Number.isNaN(gpaValue) ||
        job.gpaMin === null ||
        job.gpaMin <= gpaValue;
      const matchesDegree =
        degrees.length === 0 ||
        job.degree.length === 0 ||
        job.degree.some((degree) => degrees.includes(degree));
      const matchesSkills =
        skills.length === 0 ||
        job.skills.length === 0 ||
        job.skills.some((skill) => skills.includes(skill));

      return (
        matchesSearch &&
        matchesType &&
        matchesCampus &&
        matchesGpa &&
        matchesDegree &&
        matchesSkills
      );
    });
  }, [jobs, search, jobType, campuses, gpaMin, degrees, skills]);

  const { campusMatchedJobs, degreeMatchedJobs, otherJobs } = useMemo(() => {
    const studentCampuses = profile?.campuses ?? [];
    const studentDegrees =
      profile?.degrees.map((degree) => degree.name.trim().toLowerCase()) ?? [];

    const campusMatchedJobs: StudentJobListItem[] = [];
    const degreeMatchedJobs: StudentJobListItem[] = [];
    const otherJobs: StudentJobListItem[] = [];

    for (const job of visibleJobs ?? []) {
      const matchesCampus =
        studentCampuses.length > 0 &&
        job.campus.some((campus) => studentCampuses.includes(campus));
      const matchesDegree =
        studentDegrees.length > 0 &&
        job.degree.some((degree) =>
          studentDegrees.includes(degree.trim().toLowerCase())
        );

      if (matchesCampus) campusMatchedJobs.push(job);
      if (matchesDegree) degreeMatchedJobs.push(job);
      if (!matchesCampus && !matchesDegree) otherJobs.push(job);
    }

    return { campusMatchedJobs, degreeMatchedJobs, otherJobs };
  }, [visibleJobs, profile]);

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
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-none">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SearchField
              fullWidth
              value={search}
              onChange={setSearch}
              aria-label="Search jobs"
            >
              <SearchField.Group className="border-zinc-200">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search by title or description" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
          <Button.Root
            onPress={() => setFiltersOpen(true)}
            className="shrink-0 rounded-field border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <SlidersHorizontalIcon className="size-4" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </Button.Root>
        </div>

        {isPending ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <Spinner.Root size="lg" className="text-zinc-900" />
          </div>
        ) : isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <CircleAlertIcon className="size-10 text-rose-500" />
            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              Jobs could not be loaded
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Please try again.</p>
            <Button.Root className="mt-5" onPress={() => void refetch()}>
              Try Again
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
            <Button.Root
              className="mt-5 rounded-field border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              onPress={clearFilters}
            >
              Clear Filters
            </Button.Root>
          </div>
        ) : (
          <div>
            {jobs?.length && jobs.length > 0 && hasFilters ? (
              <p className="mb-3 text-sm text-zinc-500">
                Showing {visibleJobs?.length} of {jobs.length} jobs
              </p>
            ) : null}
            <div className="space-y-8">
              <JobFeedSection
                title="Opportunities Near You"
                jobs={campusMatchedJobs}
                onJobPress={setSelectedJob}
              />
              <JobFeedSection
                title="Opportunities Matching Your Degree"
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
        />
      ) : null}
    </div>
  );
}
