"use client";

import { useState } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { JobForm } from "@/components/jobs/job-form";

export function CreateJobModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
      }}
      title="Post a new job"
      info={{
        title: "Approval required",
        body: "After saving, the posting enters the approvals queue and stays hidden from students until a second admin approves it.",
      }}
      size="lg"
      closeDisabled={isPending}
    >
      <JobForm
        mode="create"
        onSuccess={() => onOpenChange(false)}
        onPendingChange={setIsPending}
      />
    </FormModal>
  );
}
