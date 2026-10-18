"use client";

import type { ComponentProps, ReactNode } from "react";
import { Modal } from "@heroui/react";
import { InfoPopover, type Info } from "@/components/ui/info-popover";

export function FormModal({
  isOpen,
  onOpenChange,
  title,
  info,
  size,
  closeDisabled = false,
  children,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  info?: Info;
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
              <div className="flex min-w-0 items-center">
                <Modal.Heading className="text-2xl font-semibold">
                  {title}
                </Modal.Heading>
                {info ? <InfoPopover {...info} /> : null}
              </div>
              <Modal.CloseTrigger isDisabled={closeDisabled} />
            </Modal.Header>
            {children}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}