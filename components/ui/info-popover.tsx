import { Popover } from "@heroui/react";
import { InfoIcon } from "lucide-react";

export type Info = {
  title: string;
  body: string;
};

export function InfoPopover({ title, body }: Info) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`More information: ${title}`}
        className="ml-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted outline-none transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
      >
        <InfoIcon className="size-4" />
      </Popover.Trigger>
      <Popover.Content placement="bottom end">
        <Popover.Dialog className="max-w-72">
          <Popover.Heading className="text-sm font-semibold text-foreground">
            {title}
          </Popover.Heading>
          <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}
