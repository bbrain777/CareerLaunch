import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({
  trigger,
  children,
  align = "start",
  side = "top",
  open,
  onOpenChange,
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Menu.Root open={open} onOpenChange={onOpenChange}>
      <Menu.Trigger render={trigger as React.ReactElement} />
      <Menu.Portal>
        <Menu.Positioner align={align} side={side} sideOffset={8} className="z-[9999]">
          <Menu.Popup
            className={cn(
              "dropdown-menu-popup",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-98 data-[starting-style]:opacity-0 transition-[transform,opacity] duration-120 ease-out"
            )}
          >
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  variant = "default",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "destructive";
}) {
  return (
    <Menu.Item
      onClick={onClick}
      className={cn(
        "dropdown-menu-item",
        variant === "destructive" && "danger",
        className
      )}
    >
      {children}
    </Menu.Item>
  );
}




