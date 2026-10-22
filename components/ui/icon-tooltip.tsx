import type { ReactNode } from "react";
import { Tooltip } from "@heroui/react";

export type TooltipPlacement = React.ComponentProps<
  typeof Tooltip.Content
>["placement"];

export function IconTooltip({
  label,
  className,
  placement = "top",
  children,
}: {
  label: string;
  className?: string;
  placement?: TooltipPlacement;
  children: ReactNode;
}) {
  return (
    <Tooltip.Root delay={300}>
      <Tooltip.Trigger role="presentation" tabIndex={-1} className={className}>
        {children}
      </Tooltip.Trigger>
      <Tooltip.Content
        placement={placement}
        className="max-w-56 whitespace-normal text-wrap"
      >
        {label}
      </Tooltip.Content>
    </Tooltip.Root>
  );
}
