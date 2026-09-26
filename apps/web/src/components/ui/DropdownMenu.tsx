import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({
  trigger,
  children,
  align = "start",
  side = "top",
  sideOffset = 8,
  alignOffset,
  className,
  open,
  onOpenChange,
}: {
  trigger: React.ReactElement;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Menu.Root open={open} onOpenChange={onOpenChange}>
      <Menu.Trigger render={trigger} />
      <Menu.Portal>
        <Menu.Positioner align={align} side={side} sideOffset={sideOffset} alignOffset={alignOffset} className="z-[9999]">
          <Menu.Popup
            className={cn(
              "rounded-xl ring ring-black/10 bg-white p-1.5 outline-none shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.08)]",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-98 data-[starting-style]:opacity-0 transition-[transform,opacity] duration-120 ease-out",
              className || "min-w-[200px]"
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
        "flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[14px] font-medium outline-none",
        variant === "destructive"
          ? "text-red-600 hover:bg-red-50 hover:text-red-700"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        className
      )}
    >
      {children}
    </Menu.Item>
  );
}




