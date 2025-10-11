import React, { useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect, { type Option } from "@/components/ui/searchable-select";
import HeightFilterDropdown from "@/components/ui/height-filter-dropdown";
import WeightFilterDropdown from "@/components/ui/weight-filter-dropdown";
import LocaleCountryFilter from "@/components/locale-country-filter";
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync filters with URL on mount
  useEffect(() => {
    const urlGender = searchParams.get("gender");
    const urlAge = searchParams.get("age");
    const urlMarital = searchParams.get("marital");
    const urlChildren = searchParams.get("children");
    const urlHeight = searchParams.get("height");
    const urlWeight = searchParams.get("weight");
    const urlView = searchParams.get("view");

    if (urlGender && urlGender !== gender) onGenderChange(urlGender as Gender);
    if (urlAge && urlAge !== age) onAgeChange?.(urlAge);
    if (urlMarital && urlMarital !== maritalStatus) onMaritalStatusChange?.(urlMarital);
    if (urlChildren && urlChildren !== hasChildren) onHasChildrenChange?.(urlChildren);
    if (urlHeight && urlHeight !== height) onHeightChange?.(urlHeight);
    if (urlWeight && urlWeight !== weight) onWeightChange?.(urlWeight);
    if (urlView && urlView !== viewMode) onViewModeChange(urlView as ViewMode);
  }, []);

  // Helper to update URL params
  const updateUrlParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "" && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: false });
  };

  // Wrapped handlers to sync with URL
  const handleGenderChange = (value: Gender) => {
    onGenderChange(value);
    updateUrlParam("gender", value);
  };

  const handleAgeChange = (value: string) => {
    onAgeChange?.(value);
    updateUrlParam("age", value);
  };

  const handleMaritalChange = (value: string) => {
    onMaritalStatusChange?.(value);
    updateUrlParam("marital", value);
  };

  const handleChildrenChange = (value: string) => {
    onHasChildrenChange?.(value);
    updateUrlParam("children", value);
  };

  const handleHeightChange = (value: string) => {
    onHeightChange?.(value);
    updateUrlParam("height", value);
  };

  const handleWeightChange = (value: string) => {
    onWeightChange?.(value);
    updateUrlParam("weight", value);
  };

  const handleViewChange = (value: ViewMode) => {
    onViewModeChange(value);
    updateUrlParam("view", value);
  };

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
        {/* Country filter with locale support */}
        <LocaleCountryFilter value={country} onCountryChange={onCountryChange} />

        {/* Gender filter */}
        <div className="w-24 shrink-0">
          <SearchableSelect
            value={gender}
            onValueChange={(v) => handleGenderChange(v as Gender)}
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
            onClick={() => handleViewChange("compact")}
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
            onClick={() => handleViewChange("full")}
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
            <Select value={age || ""} onValueChange={handleAgeChange}>
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
            <Select value={maritalStatus || ""} onValueChange={handleMaritalChange}>
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
            <Select value={hasChildren || ""} onValueChange={handleChildrenChange}>
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
              onSelect={(value) => handleHeightChange(value.label)}
              className="text-sm h-9 bg-background border border-input"
            />
          </div>
        )}

        {/* Weight filter */}
        {onWeightChange && (
          <div className="w-24 shrink-0">
            <WeightFilterDropdown
              value={weight}
              onSelect={(value) => handleWeightChange(value.label)}
              className="text-sm h-9 bg-background border border-input"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestFilters;
