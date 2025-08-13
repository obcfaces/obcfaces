import React, { useMemo } from "react";
import SearchableSelect, { type Option } from "@/components/ui/searchable-select";
import listIcon from "@/assets/icons/sdisplay-list.png";
import listActiveIcon from "@/assets/icons/sdisplay-list-active.png";
import tableIcon from "@/assets/icons/sdisplay-table.png";
import tableActiveIcon from "@/assets/icons/sdisplay-table-active.png";
import { Country } from "country-state-city";

type Gender = "male" | "female";
export type ViewMode = "compact" | "full";

interface ContestFiltersProps {
  country: string;
  onCountryChange: (value: string) => void;
  gender: Gender;
  onGenderChange: (value: Gender) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  genderAvailability?: { male: boolean; female: boolean };
}

const ContestFilters: React.FC<ContestFiltersProps> = ({
  country,
  onCountryChange,
  gender,
  onGenderChange,
  viewMode,
  onViewModeChange,
  genderAvailability,
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

  const genderOptions: Option[] = useMemo(() => {
    const av = genderAvailability ?? { male: false, female: true };
    return [
      { value: "female", label: "Female", disabled: !av.female },
      { value: "male", label: "Male", disabled: !av.male },
    ];
  }, [genderAvailability]);

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
      <div className="w-full sm:w-48">
        <SearchableSelect
          value={gender}
          onValueChange={(v) => onGenderChange(v as Gender)}
          options={genderOptions}
          placeholder="Select gender"
          ariaLabel="Gender filter"
        />
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
