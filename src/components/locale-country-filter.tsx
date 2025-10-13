import React, { useMemo, useContext } from "react";
import SearchableSelect, { type Option } from "@/components/ui/searchable-select";
import { ALL_COUNTRIES } from "@/data/locale-config";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface LocaleCountryFilterProps {
  value?: string;
  onCountryChange?: (countryCode: string) => void;
}

const LocaleCountryFilter: React.FC<LocaleCountryFilterProps> = ({ 
  value, 
  onCountryChange 
}) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
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
    const allCountries = ALL_COUNTRIES.map(country => {
      // Translate country name
      const translatedName = t(`country.${country.name}`) !== `country.${country.name}` 
        ? t(`country.${country.name}`) 
        : country.name;
      
      return {
        value: country.code,
        label: country.code === 'PH' ? translatedName : `${translatedName} soon`,
        disabled: country.code !== 'PH',
        flag: country.flag,
      };
    });
    
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
  }, [t]);

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
    <div className="w-full sm:w-48 shrink-0">
      <div className="[&_button]:bg-contest-light-bg [&_button]:border-contest-border [&_button:hover]:bg-contest-light-bg [&_button]:text-contest-text [&_button:hover]:text-contest-text">
        <SearchableSelect
          value={countryCode}
          onValueChange={handleCountryChange}
          options={countryOptions}
          placeholder="Select country"
          ariaLabel="Country filter"
          highlightSelected
          customTriggerRenderer={(val, opts) => {
            const selected = opts.find(o => o.value === val);
            return selected ? (
              <span className="flex items-center gap-2 text-contest-text">
                {selected.flag && <span>{selected.flag}</span>}
                <span>{selected.label}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Select country</span>
            );
          }}
        />
      </div>
    </div>
  );
};

export default LocaleCountryFilter;
