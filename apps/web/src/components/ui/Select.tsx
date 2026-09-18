import * as React from "react";
import { ArrowDown01Icon, Tick02Icon } from "hugeicons-react";
import { Select as BaseSelect } from "@base-ui/react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
  items?: Record<string, string>;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  popupClassName?: string;
  "aria-label"?: string;
};

export function Select({
  value,
  onValueChange,
  options,
  items: itemsRecord,
  placeholder = "Select option",
  name,
  disabled,
  className,
  popupClassName,
  "aria-label": ariaLabel,
}: SelectProps) {
  const normalizedOptions: SelectOption[] = React.useMemo(() => {
    if (options) return options;
    if (itemsRecord) {
      return Object.entries(itemsRecord).map(([val, label]) => ({
        value: val,
        label,
      }));
    }
    return [];
  }, [options, itemsRecord]);

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  return (
    <BaseSelect.Root
      value={value}
      name={name}
      disabled={disabled}
      items={normalizedOptions}
      onValueChange={(nextValue) => onValueChange?.(nextValue ?? "")}
    >
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        className={cn("custom-select-trigger", className)}
      >
        <span className="custom-select-value truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <BaseSelect.Icon className="custom-select-icon">
          <ArrowDown01Icon size={14} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-[9999]"
        >
          <BaseSelect.Popup
            className={cn(
              "custom-select-popup",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-98 data-[starting-style]:opacity-0 transition-[transform,opacity] duration-120 ease-out",
              popupClassName
            )}
          >
            <BaseSelect.List className="custom-select-list">
              {normalizedOptions.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="custom-select-item"
                >
                  <BaseSelect.ItemText className="truncate">
                    {option.label}
                  </BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="custom-select-indicator">
                    <Tick02Icon size={14} />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
