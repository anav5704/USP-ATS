"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, TextArea } from "@heroui/react";
import {
  CalendarDaysIcon,
  LoaderCircleIcon,
  MapPinIcon,
  SendIcon,
} from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { FormField } from "@/components/ui/form-field";
import { MetaRow } from "@/components/jobs/job-feed-card";
import { useApply } from "@/components/applications/use-apply";
import {
  createApplicationSchema,
  type CreateApplicationInput,
} from "@/lib/applications/application-schema";
import {
  JOB_DATE_TIME_ZONE,
  deadlineRemainingLabel,
} from "@/lib/jobs/job-dates";
import type { StudentJobListItem } from "@/lib/jobs/job-schema";

const dateFormatter = new Intl.DateTimeFormat("en-FJ", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: JOB_DATE_TIME_ZONE,
});

export function ApplyModal({
  job,
  isOpen,
  onOpenChange,
}: {
  job: StudentJobListItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { isPending, applyAsync } = useApply();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateApplicationInput>({
    resolver: zodResolver(createApplicationSchema),
    mode: "onChange",
    defaultValues: { jobId: job.id, coverLetter: "" },
  });

  const deadline = deadlineRemainingLabel(new Date(job.deadline));

  const submit = handleSubmit(async ({ coverLetter }) => {
    try {
      await applyAsync({ jobId: job.id, coverLetter });
      onOpenChange(false);
    } catch {
      // error toast is shown by useApply
    }
  });

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) onOpenChange(open);
      }}
      title={job.title}
      info={{
        title: "How applying works",
        body: "Submitting sends your profile snapshot and cover letter to the admins of this posting. The submitted snapshot is not updated when you later edit your profile.",
      }}
      closeDisabled={isPending}
    >
      <form
        onSubmit={submit}
        noValidate
        className="mt-5 flex min-h-0 flex-1 flex-col"
      >
        <Modal.Body>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
                {job.jobType}
              </span>
              <span className="text-sm text-muted">{job.department}</span>
            </div>

            <MetaRow
              items={[
                { icon: MapPinIcon, label: job.campus.join(", ") },
                {
                  icon: CalendarDaysIcon,
                  label: deadline.label,
                  title: dateFormatter.format(new Date(job.deadline)),
                },
              ]}
            />

            <FormField
              id="coverLetter"
              label="Cover letter"
              hint="Explain why you are a good fit for this job."
              error={errors.coverLetter?.message}
            >
              <TextArea.Root
                id="coverLetter"
                fullWidth
                rows={8}
                maxLength={2000}
                placeholder="Write your cover letter..."
                {...register("coverLetter")}
              />
            </FormField>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button.Root
              type="button"
              variant="ghost"
              isDisabled={isPending}
              onPress={() => onOpenChange(false)}
              className="w-full rounded-field text-muted sm:w-auto"
            >
              Cancel
            </Button.Root>
            <Button.Root
              type="submit"
              isDisabled={isPending}
              className="w-full rounded-field bg-foreground px-5 text-sm font-medium text-background hover:opacity-90 sm:w-auto"
            >
              {isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <SendIcon className="size-4" />
              )}
              Submit Application
            </Button.Root>
          </div>
        </Modal.Footer>
      </form>
    </FormModal>
  );
}
