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
        <Modal.Container size="sm" scroll="inside">
          <Modal.Dialog>
            <Modal.Body>
              <div className="flex flex-col items-center gap-4 px-2 py-4 text-center">
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                    danger ? "bg-rose-50 text-rose-600" : "bg-zinc-100 text-zinc-900"
                  }`}
                >
                  <Icon className="size-6" />
                </span>
                <div className="space-y-1.5">
                  <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
                  <p className="text-sm leading-relaxed text-zinc-500">{message}</p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <div className="grid w-full grid-cols-2 gap-3 pt-4">
                <Button.Root
                  type="button"
                  variant="ghost"
                  isDisabled={isPending}
                  onPress={() => onOpenChange(false)}
                  className="w-full text-zinc-600"
                >
                  {cancelLabel}
                </Button.Root>
                <Button.Root
                  type="button"
                  isDisabled={isPending}
                  onPress={onConfirm}
                  className={
                    danger
                      ? "w-full rounded-field bg-rose-600 px-5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
                      : "w-full rounded-field bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
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