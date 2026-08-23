"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, Spinner } from "@heroui/react";
import { CircleAlertIcon } from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { JobForm } from "@/components/jobs/job-form";
import { useAdminJob } from "@/components/jobs/use-admin-jobs";
import type { JobInput } from "@/lib/jobs/job-schema";

export function EditJobModal({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { data: job, isPending, isError, refetch } = useAdminJob(jobId);

  const close = () => {
    setIsOpen(false);
    router.push("/");
  };

  const initialData: JobInput | undefined = job
    ? {
        title: job.title,
        description: job.description,
        department: job.department,
        jobType: job.jobType,
        campus: job.campus,
        gpaMin: job.gpaMin,
        degree: job.degree,
        skills: job.skills,
        hours: job.hours,
        hourlyPay: job.hourlyPay,
        benefit: job.benefit,
        deadline: job.deadline,
      }
    : undefined;

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) close();
      }}
      title="Edit job posting"
      size="lg"
      closeDisabled={isSaving}
    >
      {isPending ? (
        <Modal.Body>
          <div className="flex min-h-72 items-center justify-center">
            <Spinner.Root size="lg" />
          </div>
        </Modal.Body>
      ) : isError || !initialData ? (
        <>
          <Modal.Body>
            <div className="flex min-h-60 flex-col items-center justify-center text-center">
              <CircleAlertIcon className="size-10 text-rose-500" />
              <h2 className="mt-4 text-base font-semibold text-zinc-900">
                Job posting could not be loaded
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                It may no longer exist. Please try again.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="flex w-full justify-end gap-3">
              <Button.Root variant="ghost" onPress={close}>Close</Button.Root>
              <Button.Root onPress={() => void refetch()}>Try again</Button.Root>
            </div>
          </Modal.Footer>
        </>
      ) : (
        <JobForm
          key={JSON.stringify(initialData)}
          mode="update"
          jobId={jobId}
          initialData={initialData}
          onSuccess={close}
          onPendingChange={setIsSaving}
        />
      )}
    </FormModal>
  );
}
