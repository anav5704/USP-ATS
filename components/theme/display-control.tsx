"use client";

import { useSyncExternalStore } from "react";
import { Switch, Tooltip } from "@heroui/react";
import { MoonIcon, SunIcon } from "lucide-react";
import {
  getServerTheme,
  getTheme,
  setTheme,
  subscribeToTheme,
} from "@/lib/theme/theme-store";

export function DisplayControl({ expanded = false }: { expanded?: boolean }) {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, getServerTheme);
  const isDark = theme === "dark";
  const modeLabel = isDark ? "Dark Mode" : "Light Mode";

  return (
    <Tooltip.Root delay={300}>
      <Tooltip.Trigger className="w-full" role="presentation" tabIndex={-1}>
        <Switch.Root
          size="sm"
          aria-label="Display: Dark Mode"
          aria-describedby="display-current-mode"
          isSelected={isDark}
          onChange={(selected) => setTheme(selected ? "dark" : "light")}
          className="display-control w-full"
        >
          <Switch.Content className={`w-full gap-3 rounded-field py-2 text-sidebar-foreground ${expanded ? "min-h-11 justify-start px-5" : "justify-center lg:justify-start lg:pl-5 lg:pr-3"}`}>
            <span aria-hidden="true" className={expanded ? "contents" : "hidden lg:contents"}>
              <SunIcon className="theme-light-icon size-5 shrink-0" />
              <MoonIcon className="theme-dark-icon size-5 shrink-0" />
              <span className="flex-1 text-left">Display</span>
            </span>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
          <span id="display-current-mode" className="sr-only">
            {modeLabel}
          </span>
        </Switch.Root>
      </Tooltip.Trigger>
      <Tooltip.Content placement="top">{modeLabel}</Tooltip.Content>
    </Tooltip.Root>
  );
}
