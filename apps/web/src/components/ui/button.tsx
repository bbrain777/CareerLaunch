import { Button as KumoButton } from "@cloudflare/kumo";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type KumoButtonProps = ComponentProps<typeof KumoButton>;

export type ButtonProps = Omit<KumoButtonProps, "size"> & {
  size?: "xs" | "sm" | "base" | "lg" | "default" | "compact" | "icon" | "icon-compact";
};

export function Button({ className, size, shape = "base", ...props }: ButtonProps) {
  const kumoSize: "xs" | "sm" | "base" | "lg" | undefined =
    size === "icon" || size === "default"
      ? "base"
      : size === "icon-compact" || size === "compact"
      ? "sm"
      : size;

  return (
    <KumoButton
      shape={shape as any}
      size={kumoSize}
      className={cn(
        "cursor-pointer font-medium select-none justify-center [&>span:last-child]:w-full [&>span:last-child]:justify-center",
        className
      )}
      {...(props as any)}
    />
  );
}
