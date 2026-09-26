import {
  Dialog as KumoDialog,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@cloudflare/kumo";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export {
  KumoDialog,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
};

export const DialogRoot = KumoDialog.Root;
export type DialogRootProps = ComponentProps<typeof KumoDialog.Root>;
export type DialogProps = ComponentProps<typeof KumoDialog>;

export function Dialog({ className, ...props }: DialogProps) {
  return (
    <KumoDialog
      className={cn(
        "bg-kumo-base shadow-lg ring ring-kumo-line rounded-xl text-kumo-default",
        className
      )}
      {...props}
    />
  );
}

Dialog.Root = KumoDialog.Root;
Dialog.Trigger = DialogTrigger;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Close = DialogClose;
