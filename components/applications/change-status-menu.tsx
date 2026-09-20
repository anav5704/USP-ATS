"use client";

import { Dropdown } from "@heroui/react";
import { ChevronDownIcon } from "lucide-react";
import {
  ApplicationStatusBadge,
  APPLICATION_STATUS_LABELS,
} from "@/components/applications/application-status-badge";
import { allowedAdminStatusTargets } from "@/lib/applications/application-rules";
import type {
  AdminApplicationStatus,
  ApplicationStatus,
} from "@/lib/applications/application-schema";

export function ChangeStatusMenu({
  status,
  isDisabled = false,
  onSelect,
}: {
  status: ApplicationStatus;
  isDisabled?: boolean;
  onSelect: (status: AdminApplicationStatus) => void;
}) {
  const targets = allowedAdminStatusTargets(status);

  if (targets.length === 0) {
    return <ApplicationStatusBadge status={status} />;
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={`Change status from ${APPLICATION_STATUS_LABELS[status]}`}
        isDisabled={isDisabled}
        className="flex items-center gap-1 rounded-field transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ApplicationStatusBadge status={status} />
        <ChevronDownIcon className="size-3.5" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu>
          {targets.map((target) => (
            <Dropdown.Item
              key={target}
              id={target}
              textValue={APPLICATION_STATUS_LABELS[target]}
              onAction={() => onSelect(target)}
            >
              {APPLICATION_STATUS_LABELS[target]}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
