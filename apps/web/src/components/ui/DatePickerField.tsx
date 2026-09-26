import { useState } from "react";
import { CalendarDotsIcon } from "@phosphor-icons/react";
import { Button, DatePicker, Label, Popover } from "@cloudflare/kumo";

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromISODate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

const formatDay = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function DatePickerField({
  label,
  value,
  onValueChange,
  placeholder = "Pick a date",
  fromDate,
  toDate,
}: {
  label: string;
  /** Date in YYYY-MM-DD form, or null/undefined for no selection. */
  value: string | null | undefined;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  /** Earliest selectable day. */
  fromDate?: Date;
  /** Latest selectable day. */
  toDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const selected = fromISODate(value);

  return (
    <div>
      <Label className="block mb-1.5">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          render={
            <Button
              variant="outline"
              icon={<CalendarDotsIcon size={16} />}
              className="w-full justify-start font-normal"
              aria-label={label}
            />
          }
        >
          <span className={`inline-flex items-center gap-2 pl-2 ${selected ? "" : "opacity-55"}`}>
            {selected ? formatDay.format(selected) : placeholder}
          </span>
        </Popover.Trigger>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="p-3"
        >
          <DatePicker
            mode="single"
            selected={selected}
            fromDate={fromDate}
            toDate={toDate}
            onChange={(next?: Date) => onValueChange(next ? toISODate(next) : null)}
          />
        </Popover.Content>
      </Popover>
    </div>
  );
}