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
        <Modal.Container size={size ?? "lg"} scroll="inside" className="p-2 sm:p-4">
          <Modal.Dialog className="max-h-[calc(100dvh-1rem)] min-w-0 w-[calc(100vw-1rem)] max-w-2xl break-words pt-0 sm:max-h-[calc(100dvh-2rem)]">
            <Modal.Header className="flex-row items-center justify-between gap-2 pt-4">
              <div className="flex min-w-0 items-center">
                <Modal.Heading className="min-w-0 break-words text-xl font-semibold sm:text-2xl">
                  {title}
                </Modal.Heading>
                {info ? <InfoPopover {...info} /> : null}
              </div>
              <Modal.CloseTrigger isDisabled={closeDisabled} className="static" />
            </Modal.Header>
            {children}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
