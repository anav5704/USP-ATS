"use client";

import type { ReactNode } from "react";
import { Button, Modal } from "@heroui/react";
import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ConfirmModal({
  isOpen,
  onOpenChange,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  isPending = false,
  icon: Icon = TriangleAlertIcon,
  danger = true,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
  icon?: LucideIcon;
  danger?: boolean;
}) {
  return (
    <Modal.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="sm" scroll="inside" className="p-2 sm:p-4">
          <Modal.Dialog className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)]">
            <Modal.Body>
              <div className="flex flex-col items-center gap-4 px-2 py-4 text-center">
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                    danger ? "bg-danger-soft text-danger" : "bg-surface-secondary text-foreground"
                  }`}
                >
                  <Icon className="size-6" />
                </span>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                  <p className="text-sm leading-relaxed text-muted">{message}</p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <div className="grid w-full grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
                <Button.Root
                  type="button"
                  variant="ghost"
                  isDisabled={isPending}
                  onPress={() => onOpenChange(false)}
                  className="w-full text-muted"
                >
                  {cancelLabel}
                </Button.Root>
                <Button.Root
                  type="button"
                  isDisabled={isPending}
                  onPress={onConfirm}
                  className={
                    danger
                      ? "w-full rounded-field bg-danger px-5 text-sm font-medium text-danger-foreground transition-colors hover:bg-danger-hover"
                      : "w-full rounded-field bg-foreground px-5 text-sm font-medium text-background transition-colors hover:opacity-90"
                  }
                >
                  {isPending ? (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  ) : null}
                  {confirmLabel}
                </Button.Root>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
