import * as React from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateInputProps {
  /** Value in YYYY-MM-DD format */
  value: string;
  /** Called with YYYY-MM-DD string */
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  /** Show month/year dropdowns in the calendar (great for DOB selection) */
  dropdownNav?: boolean;
  /** Earliest selectable year. Defaults to 1920 when dropdownNav is enabled. */
  fromYear?: number;
  /** Latest selectable year. Defaults to current year when dropdownNav is enabled. */
  toYear?: number;
}

export function DateInput({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  id,
  required,
  disabled,
  dropdownNav,
  fromYear,
  toYear,
}: DateInputProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  const isValidDate = selectedDate && !isNaN(selectedDate.getTime());

  const currentYear = new Date().getFullYear();
  const resolvedFromYear = fromYear ?? 1920;
  const resolvedToYear = toYear ?? currentYear;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {isValidDate ? format(selectedDate, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[9999]" align="start">
        <Calendar
          mode="single"
          selected={isValidDate ? selectedDate : undefined}
          defaultMonth={isValidDate ? selectedDate : dropdownNav ? new Date(resolvedToYear - 8, 0) : undefined}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"));
            } else {
              onChange("");
            }
            setOpen(false);
          }}
          initialFocus
          captionLayout={dropdownNav ? "dropdown-buttons" : undefined}
          fromYear={dropdownNav ? resolvedFromYear : undefined}
          toYear={dropdownNav ? resolvedToYear : undefined}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
