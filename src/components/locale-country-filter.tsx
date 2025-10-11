import React, { useMemo, useContext } from "react";
import SearchableSelect, { type Option } from "@/components/ui/searchable-select";
import { ALL_COUNTRIES } from "@/data/locale-config";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface LocaleCountryFilterProps {
  value?: string;
  onCountryChange?: (countryCode: string) => void;
}

const LocaleCountryFilter: React.FC<LocaleCountryFilterProps> = ({ 
  value, 
  onCountryChange 
}) => {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();

  // Try to get context from PublicCountryProvider if available
  let contextCountryCode: string | undefined;
  let contextLanguageCode: string | undefined;
  let contextNavigateToLocale: ((countryCode: string, languageCode?: string) => void) | undefined;

  try {
    // Dynamically import the context hook
    const { usePublicCountry } = require('@/contexts/PublicCountryContext');
    const context = usePublicCountry();
    contextCountryCode = context.countryCode;
    contextLanguageCode = context.languageCode;
    contextNavigateToLocale = context.navigateToLocale;
  } catch (e) {
    // Context not available, use props
  }

  const countryCode = value || contextCountryCode || 'PH';
  const languageCode = contextLanguageCode || currentLanguage.code;

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
    // If context navigator is available, use it
    if (contextNavigateToLocale) {
      contextNavigateToLocale(newCountryCode, languageCode);
    } else {
      // Otherwise, use regular navigate with locale format
      navigate(`/${languageCode}-${newCountryCode.toLowerCase()}`);
    }
    
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
