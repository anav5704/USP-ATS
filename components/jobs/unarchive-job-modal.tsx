"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseDate } from "@internationalized/date";
import { Button, Modal, Spinner } from "@heroui/react";
import { CircleAlertIcon, RotateCcwIcon } from "lucide-react";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { FormModal } from "@/components/ui/form-modal";
import { todayInFiji } from "@/lib/jobs/job-dates";
import {
  unarchiveJobInputSchema,
  type AdminJobListItem,
  type UnarchiveJobInput,
} from "@/lib/jobs/job-schema";

export function UnarchiveJobModal({
  job,
  isPending,
  error,
  onClose,
  onSubmit,
}: {
  job: AdminJobListItem;
  isPending: boolean;
  error: Error | null;
  onClose: () => void;
  onSubmit: (input: UnarchiveJobInput) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UnarchiveJobInput>({
    resolver: zodResolver(unarchiveJobInputSchema),
    defaultValues: { deadline: "" },
    mode: "onChange",
  });
  const minimumDate = parseDate(todayInFiji()).add({ days: 1 });

  return (
    <FormModal
      isOpen
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
      title="Unarchive job posting"
      closeDisabled={isPending}
    >
      <form
        className="mt-5 flex min-h-0 flex-1 flex-col"
        onSubmit={handleSubmit(async (input) => onSubmit(input))}
      >
        <Modal.Body>
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-secondary p-4">
            <RotateCcwIcon className="mt-0.5 size-5 shrink-0 text-muted" />
            <div>
              <p className="text-sm font-medium text-foreground">{job.title}</p>
              <p className="mt-1 text-sm text-muted">
                This job posting&apos;s application deadline has passed. Select a new deadline to submit the unarchive request for approval.
              </p>
            </div>
          </div>
          <Controller
            name="deadline"
            control={control}
            render={({ field }) => (
              <DatePickerField
                id="unarchive-deadline"
                label="New Application Deadline"
                value={field.value}
                onChange={field.onChange}
                error={errors.deadline?.message}
                minValue={minimumDate}
              />
            )}
          />
          {error ? (
            <p role="alert" className="flex items-center gap-2 text-sm text-danger">
              <CircleAlertIcon className="size-4 shrink-0" />
              {error.message}
            </p>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button.Root variant="ghost" isDisabled={isPending} onPress={onClose}>
            Cancel
          </Button.Root>
          <Button.Root
            type="submit"
            isDisabled={isPending}
            className="rounded-field bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
          >
            {isPending ? <Spinner.Root size="sm" /> : <RotateCcwIcon className="size-4" />}
            Submit for Approval
          </Button.Root>
        </Modal.Footer>
      </form>
    </FormModal>
  );
}
