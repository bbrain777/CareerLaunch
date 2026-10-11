import { Button as KumoButton } from "@cloudflare/kumo";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type KumoButtonProps = ComponentProps<typeof KumoButton>;

export type ButtonProps = Omit<KumoButtonProps, "size"> & {
  size?: "xs" | "sm" | "base" | "lg" | "default" | "compact" | "icon" | "icon-compact";
};

export function Button({ className, size, shape = "base", variant, ...props }: ButtonProps & { variant?: string }) {
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
      variant={variant as any}
      className={cn(
        "cursor-pointer font-medium select-none justify-center rounded-lg transition-all active:scale-[0.98] [&>span:last-child]:w-full [&>span:last-child]:justify-center",
        variant === "primary" && "!rounded-lg !bg-[#0a5c4d] hover:!bg-[#07473b] text-white border-0 shadow-sm",
        variant === "secondary" && "!rounded-lg border border-[#dad7d0] bg-white text-[#1d1c1a] hover:bg-[#f6f5f2] shadow-sm",
        className
      )}
      {...(props as any)}
    />
  );
}
