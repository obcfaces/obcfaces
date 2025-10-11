import React, { useMemo } from "react";
import SearchableSelect, { type Option } from "@/components/ui/searchable-select";
import { ALL_COUNTRIES } from "@/data/locale-config";
import { usePublicCountry } from "@/contexts/PublicCountryContext";

interface LocaleCountryFilterProps {
  onCountryChange?: (countryCode: string) => void;
}

const LocaleCountryFilter: React.FC<LocaleCountryFilterProps> = ({ onCountryChange }) => {
  const { countryCode, navigateToLocale, languageCode } = usePublicCountry();

  const countryOptions: Option[] = useMemo(() => {
    const allCountries = ALL_COUNTRIES.map(country => ({
      value: country.code,
      label: country.code === 'PH' ? country.name : `${country.name} soon`,
      disabled: country.code !== 'PH',
      flag: country.flag,
    }));
    
    // Sort alphabetically but put Philippines first
    const philippines = allCountries.find(c => c.value === 'PH');
    const otherCountries = allCountries
      .filter(c => c.value !== 'PH')
      .sort((a, b) => a.label.localeCompare(b.label));
    
    return [
      // Active countries
      ...(philippines ? [philippines] : []),
      { value: "__divider__", label: "", disabled: true, divider: true },
      // All other countries with "soon" label
      ...otherCountries
    ];
  }, []);

  const handleCountryChange = (newCountryCode: string) => {
    // Update URL with new locale
    navigateToLocale(newCountryCode, languageCode);
    
    // Call external handler if provided
    if (onCountryChange) {
      onCountryChange(newCountryCode);
    }
  };

  return (
    <div className="w-36 shrink-0">
      <SearchableSelect
        value={countryCode}
        onValueChange={handleCountryChange}
        options={countryOptions}
        placeholder="Select country"
        ariaLabel="Country filter"
        highlightSelected
      />
    </div>
  );
};

export default LocaleCountryFilter;
