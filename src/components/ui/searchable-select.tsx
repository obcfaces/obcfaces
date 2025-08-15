import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string; disabled?: boolean; divider?: boolean };

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  ariaLabel?: string;
  invalid?: boolean;
  highlightSelected?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  disabled,
  emptyMessage = "Nothing found",
  ariaLabel,
  invalid = false,
  highlightSelected = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          aria-invalid={invalid}
          className={cn(
            "w-full justify-between",
            !selected && "text-muted-foreground",
            invalid && "border-destructive focus:ring-destructive",
            highlightSelected && selected && "border-primary focus:ring-primary"
          )}
        >
          {selected ? selected.label : (placeholder || "Select...")}
          <ChevronsUpDown className="ml-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(var(--radix-popover-trigger-width)*1.3)] p-0 z-50 bg-popover" onWheelCapture={(e) => e.stopPropagation()} onOpenAutoFocus={(e) => e.preventDefault()}>
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandList className="max-h-64 overflow-y-auto">
            <CommandGroup>
              {options.map((opt, idx) => (
                opt.divider ? (
                  <div
                    key={`divider-${idx}`}
                    className="my-1 border-t border-border"
                    role="separator"
                    aria-hidden="true"
                  />
                ) : (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      if (opt.disabled) return;
                      onValueChange(opt.value);
                      setOpen(false);
                    }}
                    aria-disabled={opt.disabled || undefined}
                    className={cn(
                      "cursor-pointer",
                      opt.disabled && "opacity-60 pointer-events-none"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === opt.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex items-center gap-2">
                      <span>{opt.label}</span>
                      {opt.disabled && (
                        <span className="text-xs italic text-muted-foreground">soon</span>
                      )}
                    </span>
                  </CommandItem>
                )
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableSelect;
