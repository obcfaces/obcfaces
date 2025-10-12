import React, { useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect, { type Option } from "@/components/ui/searchable-select";
import HeightFilterDropdown from "@/components/ui/height-filter-dropdown";
import WeightFilterDropdown from "@/components/ui/weight-filter-dropdown";
import LocaleCountryFilter from "@/components/locale-country-filter";
import { AlignJustify, Grid2X2 } from "lucide-react";
import { patchSearchParams } from "@/utils/urlFilters";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
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

  // Helper to update URL params using utility
  const updateUrlParam = useCallback((key: string, value: string | undefined) => {
    const params = patchSearchParams(searchParams, { [key]: value });
    setSearchParams(params, { replace: false });
  }, [searchParams, setSearchParams]);

  // Wrapped handlers to sync with URL (memoized to prevent unnecessary re-renders)
  const handleGenderChange = useCallback((value: Gender) => {
    onGenderChange(value);
    updateUrlParam("gender", value);
  }, [onGenderChange, updateUrlParam]);

  const handleAgeChange = useCallback((value: string) => {
    onAgeChange?.(value);
    updateUrlParam("age", value);
  }, [onAgeChange, updateUrlParam]);

  const handleMaritalChange = useCallback((value: string) => {
    onMaritalStatusChange?.(value);
    updateUrlParam("marital", value);
  }, [onMaritalStatusChange, updateUrlParam]);

  const handleChildrenChange = useCallback((value: string) => {
    onHasChildrenChange?.(value);
    updateUrlParam("children", value);
  }, [onHasChildrenChange, updateUrlParam]);

  const handleHeightChange = useCallback((value: string) => {
    onHeightChange?.(value);
    updateUrlParam("height", value);
  }, [onHeightChange, updateUrlParam]);

  const handleWeightChange = useCallback((value: string) => {
    onWeightChange?.(value);
    updateUrlParam("weight", value);
  }, [onWeightChange, updateUrlParam]);

  const handleViewChange = useCallback((value: ViewMode) => {
    onViewModeChange(value);
    updateUrlParam("view", value);
  }, [onViewModeChange, updateUrlParam]);

  const genderOptions: Option[] = useMemo(() => {
    const av = genderAvailability ?? { male: false, female: true };
    return [
      { value: "female", label: t("Female"), disabled: !av.female },
      { value: "male", label: t("Male"), disabled: !av.male },
    ];
  }, [genderAvailability, t]);

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
                <SelectItem value="">{t("filter.allAges")}</SelectItem>
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
                <SelectItem value="">{t("filter.allStatus")}</SelectItem>
                <SelectItem value="single">{t("marital.single")}</SelectItem>
                <SelectItem value="married">{t("marital.married")}</SelectItem>
                <SelectItem value="divorced">{t("marital.divorced")}</SelectItem>
                <SelectItem value="widowed">{t("marital.widowed")}</SelectItem>
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
                <SelectItem value="">{t("filter.allStatus")}</SelectItem>
                <SelectItem value="true">{t("filter.hasChildren")}</SelectItem>
                <SelectItem value="false">{t("filter.noChildren")}</SelectItem>
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
