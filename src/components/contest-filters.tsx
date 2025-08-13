import React, { useMemo } from "react";
import SearchableSelect, { type Option } from "@/components/ui/searchable-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import listIcon from "@/assets/icons/sdisplay-list.png";
import listActiveIcon from "@/assets/icons/sdisplay-list-active.png";
import tableIcon from "@/assets/icons/sdisplay-table.png";
import tableActiveIcon from "@/assets/icons/sdisplay-table-active.png";
import { Country } from "country-state-city";

type Gender = "all" | "women" | "men";
export type ViewMode = "compact" | "full";

interface ContestFiltersProps {
  country: string;
  onCountryChange: (value: string) => void;
  gender: Gender;
  onGenderChange: (value: Gender) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
}

const ContestFilters: React.FC<ContestFiltersProps> = ({
  country,
  onCountryChange,
  gender,
  onGenderChange,
  viewMode,
  onViewModeChange,
}) => {
  const countryOptions: Option[] = useMemo(() => {
    try {
      const list = Country.getAllCountries?.() || [];
      return list.map((c) => ({ value: c.isoCode, label: c.name }));
    } catch {
      return [
        { value: "PH", label: "Philippines" },
        { value: "US", label: "United States" },
        { value: "GB", label: "United Kingdom" },
      ];
    }
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Country filter */}
      <div className="w-full sm:w-64">
        <SearchableSelect
          value={country}
          onValueChange={onCountryChange}
          options={countryOptions}
          placeholder="Select country"
          ariaLabel="Country filter"
        />
      </div>

      {/* Gender filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Gender:</span>
        <RadioGroup
          value={gender}
          onValueChange={(v) => onGenderChange(v as Gender)}
          className="flex flex-row items-center gap-4"
          aria-label="Gender filter"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem id="gender-all" value="all" />
            <Label htmlFor="gender-all" className="text-sm">All</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="gender-women" value="women" />
            <Label htmlFor="gender-women" className="text-sm">Women</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="gender-men" value="men" />
            <Label htmlFor="gender-men" className="text-sm">Men</Label>
          </div>
        </RadioGroup>
      </div>

      {/* View toggles */}
      <div className="flex items-center gap-1 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onViewModeChange("full")}
          aria-pressed={viewMode === "full"}
          aria-label="List view"
          className="p-1 rounded-md hover:bg-accent transition-colors"
        >
          <img
            src={viewMode === "full" ? listActiveIcon : listIcon}
            alt="List view icon"
            width={28}
            height={28}
            loading="lazy"
          />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("compact")}
          aria-pressed={viewMode === "compact"}
          aria-label="Grid view"
          className="p-1 rounded-md hover:bg-accent transition-colors"
        >
          <img
            src={viewMode === "compact" ? tableActiveIcon : tableIcon}
            alt="Grid view icon"
            width={28}
            height={28}
            loading="lazy"
          />
        </button>
      </div>
    </div>
  );
};

export default ContestFilters;
