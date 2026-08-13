"use client";

import { useState } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { JobForm } from "@/components/jobs/job-form";
import type { AdminJobListItem } from "@/lib/jobs/job-schema";
import type { JobInput } from "@/lib/jobs/job-schema";
import { toFijiDate } from "@/lib/jobs/job-dates";

export function EditJobModal({
  job,
  isOpen,
  onOpenChange,
}: {
  job: AdminJobListItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const initialData: JobInput = {
    title: job.title,
    description: job.description,
    department: job.department as JobInput["department"],
    jobType: job.jobType as JobInput["jobType"],
    campus: job.campus as JobInput["campus"],
    gpaMin: job.gpaMin,
    degree: job.degree,
    skills: job.skills,
    hours: job.hours,
    hourlyPay: job.hourlyPay,
    deadline: toFijiDate(new Date(job.deadline)),
  };

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) onOpenChange(open);
      }}
      title="Edit job posting"
      size="lg"
      closeDisabled={isSaving}
    >
      <JobForm
        key={JSON.stringify(initialData)}
        mode="update"
        jobId={job.id}
        initialData={initialData}
        onSuccess={() => onOpenChange(false)}
        onPendingChange={setIsSaving}
      />
    </FormModal>
  );
}