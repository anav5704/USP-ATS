"use client";

import type { ComponentProps, ReactNode } from "react";
import { Modal } from "@heroui/react";

export function FormModal({
  isOpen,
  onOpenChange,
  title,
  size,
  closeDisabled = false,
  children,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  size?: ComponentProps<typeof Modal.Container>["size"];
  closeDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Modal.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size={size ?? "lg"} scroll="inside">
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <Modal.Heading className="text-2xl font-semibold">
                {title}
              </Modal.Heading>
              <Modal.CloseTrigger isDisabled={closeDisabled} />
            </Modal.Header>
            {children}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}