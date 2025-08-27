import React, { useMemo } from "react";
import { Country } from 'country-state-city';
import SearchableSelect, { type Option } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HeightFilterDropdown from "@/components/ui/height-filter-dropdown";
import WeightFilterDropdown from "@/components/ui/weight-filter-dropdown";
import { AlignJustify, Grid2X2 } from "lucide-react";

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
  // Additional filter props
  age?: string;
  onAgeChange?: (value: string) => void;
  maritalStatus?: string;
  onMaritalStatusChange?: (value: string) => void;
  hasChildren?: string;
  onHasChildrenChange?: (value: string) => void;
  height?: string;
  onHeightChange?: (value: string) => void;
  weight?: string;
  onWeightChange?: (value: string) => void;
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
  age,
  onAgeChange,
  maritalStatus,
  onMaritalStatusChange,
  hasChildren,
  onHasChildrenChange,
  height,
  onHeightChange,
  weight,
  onWeightChange,
}) => {
  const countryOptions: Option[] = useMemo(() => {
    const allCountries = Country.getAllCountries().map(country => ({
      value: country.isoCode,
      label: country.isoCode === 'PH' ? country.name : `${country.name} soon`,
      disabled: country.isoCode !== 'PH'
    }));
    
    // Sort alphabetically but put Philippines first
    const philippines = allCountries.find(c => c.value === 'PH');
    const otherCountries = allCountries.filter(c => c.value !== 'PH').sort((a, b) => a.label.localeCompare(b.label));
    
    return [
      // Active countries
      ...(philippines ? [philippines] : []),
      { value: "__divider__", label: "", disabled: true, divider: true },
      // All other countries with "soon" label
      ...otherCountries
    ];
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
    { value: "miss", label: "Miss (18-27 y.o.)", disabled: true },
    { value: "ms", label: "Ms (28-39 y.o.)", disabled: true },
    { value: "mrs", label: "Mrs (18-60 y.o.)", disabled: true },
  ], []);

  return (
    <div className="space-y-4 w-full">
      {/* First row - Main filters */}
      <div className="flex flex-row flex-nowrap items-center gap-2 w-full">
        {/* Country filter */}
        <div className="w-36 shrink-0">
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

        {/* View toggles */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange("compact")}
            aria-pressed={viewMode === "compact"}
            aria-label="List view"
            className="p-1 rounded-md hover:bg-accent transition-colors"
          >
            <AlignJustify 
              size={28} 
              strokeWidth={1}
              className={viewMode === "compact" ? "text-primary" : "text-muted-foreground"}
            />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("full")}
            aria-pressed={viewMode === "full"}
            aria-label="Grid view"
            className="p-1 rounded-md hover:bg-accent transition-colors"
          >
            <Grid2X2 
              size={28} 
              strokeWidth={1}
              className={viewMode === "full" ? "text-primary" : "text-muted-foreground"}
            />
          </button>
        </div>
      </div>

      {/* Second row - Additional filters */}
      <div className="flex flex-row flex-wrap items-center gap-2 w-full">
        {/* Age filter */}
        {onAgeChange && (
          <div className="w-24 shrink-0">
            <Select value={age || ""} onValueChange={onAgeChange}>
              <SelectTrigger className="text-sm h-9 bg-background border border-input">
                <SelectValue placeholder="Age" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="">All Ages</SelectItem>
                <SelectItem value="18-25">18-25</SelectItem>
                <SelectItem value="26-35">26-35</SelectItem>
                <SelectItem value="36-45">36-45</SelectItem>
                <SelectItem value="46+">46+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Marital Status filter */}
        {onMaritalStatusChange && (
          <div className="w-28 shrink-0">
            <Select value={maritalStatus || ""} onValueChange={onMaritalStatusChange}>
              <SelectTrigger className="text-sm h-9 bg-background border border-input">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Has Children filter */}
        {onHasChildrenChange && (
          <div className="w-28 shrink-0">
            <Select value={hasChildren || ""} onValueChange={onHasChildrenChange}>
              <SelectTrigger className="text-sm h-9 bg-background border border-input">
                <SelectValue placeholder="Children" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="">All</SelectItem>
                <SelectItem value="true">Has Children</SelectItem>
                <SelectItem value="false">No Children</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Height filter */}
        {onHeightChange && (
          <div className="w-24 shrink-0">
            <HeightFilterDropdown
              value={height}
              onSelect={(value) => onHeightChange?.(value.label)}
              className="text-sm h-9 bg-background border border-input"
            />
          </div>
        )}

        {/* Weight filter */}
        {onWeightChange && (
          <div className="w-24 shrink-0">
            <WeightFilterDropdown
              value={weight}
              onSelect={(value) => onWeightChange?.(value.label)}
              className="text-sm h-9 bg-background border border-input"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestFilters;
