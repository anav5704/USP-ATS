"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal } from "@/components/ui/form-modal";
import { JobForm } from "@/components/jobs/job-form";

export function CreateJobModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isPending, setIsPending] = useState(false);

  const close = () => {
    setIsOpen(false);
    router.push("/admin/jobs");
  };

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) close();
      }}
      title="Post a new job"
      size="lg"
      closeDisabled={isPending}
    >
      <JobForm
        mode="create"
        onSuccess={close}
        onPendingChange={setIsPending}
      />
    </FormModal>
  );
}
