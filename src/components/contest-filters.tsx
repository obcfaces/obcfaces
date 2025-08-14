import React, { useMemo } from "react";
import SearchableSelect, { type Option } from "@/components/ui/searchable-select";
import listIcon from "@/assets/icons/sdisplay-list.png";
import listActiveIcon from "@/assets/icons/sdisplay-list-active.png";
import tableIcon from "@/assets/icons/sdisplay-table.png";
import tableActiveIcon from "@/assets/icons/sdisplay-table-active.png";
import { Country } from "country-state-city";

type Gender = "male" | "female";
export type Category = "teen" | "miss" | "ms" | "mrs";
export type ViewMode = "compact" | "full";
interface ContestFiltersProps {
  country: string;
  onCountryChange: (value: string) => void;
  gender: Gender;
  onGenderChange: (value: Gender) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  category: Category | "";
  onCategoryChange: (value: Category | "") => void;
  genderAvailability?: { male: boolean; female: boolean };
}

const ContestFilters: React.FC<ContestFiltersProps> = ({
  country,
  onCountryChange,
  gender,
  onGenderChange,
  viewMode,
  onViewModeChange,
  category,
  onCategoryChange,
  genderAvailability,
}) => {
  const countryOptions: Option[] = useMemo(() => {
    try {
      const list = Country.getAllCountries?.() || [];
      const ph = list.find((c) => c.isoCode === "PH");
      const others = list
        .filter((c) => c.isoCode !== "PH")
        .sort((a, b) => a.name.localeCompare(b.name));

      const header = ph
        ? { value: ph.isoCode, label: ph.name }
        : { value: "PH", label: "Philippines" };

      return [
        header,
        { value: "__divider__", label: "divider", disabled: true, divider: true },
        ...others.map((c) => ({ value: c.isoCode, label: c.name, disabled: true })),
      ];
    } catch {
      return [
        { value: "PH", label: "Philippines" },
        { value: "__divider__", label: "divider", disabled: true, divider: true },
        { value: "US", label: "United States", disabled: true },
        { value: "GB", label: "United Kingdom", disabled: true },
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

const categoryOptions: Option[] = useMemo(() => [
  { value: "teen", label: "Teen (13-17 y.o.)", disabled: true },
  { value: "miss", label: "Miss (18-27 y.o.)" },
  { value: "ms", label: "Ms (28-39 y.o.)", disabled: true },
  { value: "mrs", label: "Mrs (18-60 y.o.)", disabled: true },
], []);

  return (
    <div className="flex flex-row flex-nowrap items-center gap-2 w-full">
      {/* Country filter */}
      <div className="w-44 shrink-0">
        <SearchableSelect
          value={country}
          onValueChange={onCountryChange}
          options={countryOptions}
          placeholder="Select country"
          ariaLabel="Country filter"
          highlightSelected
        />
      </div>

      {/* Gender filter */}
      <div className="w-24 shrink-0">
        <SearchableSelect
          value={gender}
          onValueChange={(v) => onGenderChange(v as Gender)}
          options={genderOptions}
          placeholder="Select gender"
          ariaLabel="Gender filter"
          highlightSelected
        />
      </div>

      {/* Category filter */}
      <div className="w-40 shrink-0">
        <SearchableSelect
          value={category}
          onValueChange={(v) => onCategoryChange(v as Category)}
          options={categoryOptions}
          placeholder="Category"
          ariaLabel="Category filter"
          highlightSelected
        />
      </div>

      {/* View toggles */}
      <div className="ml-auto flex items-center gap-1 shrink-0">
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
      </div>
    </div>
  );
};

export default ContestFilters;
