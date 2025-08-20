import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDown, Check, Plus } from "lucide-react";
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
  allowCustom?: boolean;
  customOptionLabel?: string;
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
  allowCustom = false,
  customOptionLabel = "Add custom option",
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const selected = options.find((o) => o.value === value);

  // Check if current value is a custom value (not in options)
  const isCustomValue = value && !selected;

  // Filter options based on search
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Show custom option when allowCustom is true and search has value
  const showCustomOption = allowCustom && searchValue.trim() && 
    !filteredOptions.some(opt => opt.label.toLowerCase() === searchValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          aria-invalid={invalid}
          className={cn(
            "w-full justify-between text-sm",
            !selected && !isCustomValue && "text-muted-foreground",
            invalid && "border border-red-500 focus:ring-red-500 focus:border-red-500",
            highlightSelected && (selected || isCustomValue) && "border border-blue-500 focus:ring-blue-500 focus:border-blue-500"
          )}
        >
          {selected ? (
            <span className="text-left leading-tight break-words">{selected.label}</span>
          ) : isCustomValue ? (
            <span className="text-left leading-tight break-words">{value}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder || "Select..."}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(var(--radix-popover-trigger-width)*1.3)] p-0 z-50 bg-popover border shadow-lg" 
        onWheelCapture={(e) => e.stopPropagation()} 
        onOpenAutoFocus={(e) => e.preventDefault()}
        sideOffset={4}
        align="start"
        collisionPadding={8}
      >
        <Command>
          <CommandInput 
            placeholder="Search.../Type yours" 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandList className="max-h-64 overflow-y-auto bg-popover">
            <CommandGroup>
              {filteredOptions.map((opt, idx) => (
                opt.divider ? (
                  <div
                    key={`divider-${idx}`}
                    className="mx-2 my-1 border-t border-gray-400 dark:border-gray-500"
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
                      setSearchValue("");
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      if (opt.disabled) return;
                      onValueChange(opt.value);
                      setOpen(false);
                      setSearchValue("");
                    }}
                    aria-disabled={opt.disabled || undefined}
                    className={cn(
                      "cursor-pointer select-none rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground",
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
                      <span className="text-left leading-tight break-words">{opt.label}</span>
                      {opt.disabled && (
                        <span className="text-xs italic text-muted-foreground flex-shrink-0">soon</span>
                      )}
                    </span>
                  </CommandItem>
                )
              ))}
              
              {/* Custom option */}
              {showCustomOption && (
                <CommandItem
                  value={searchValue}
                  onSelect={() => {
                    onValueChange(searchValue.trim());
                    setOpen(false);
                    setSearchValue("");
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    onValueChange(searchValue.trim());
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="cursor-pointer select-none rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground text-primary"
                >
                  <Plus className="mr-2 size-4" />
                  <span>Add "{searchValue}"</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableSelect;