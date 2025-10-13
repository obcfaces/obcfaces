import React, { useMemo, useContext, useEffect, useState } from "react";
import SearchableSelect, { type Option } from "@/components/ui/searchable-select";
import { ALL_COUNTRIES } from "@/data/locale-config";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";

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
  const [activeCountries, setActiveCountries] = useState<string[]>([]);

  // Fetch countries that have active participants
  useEffect(() => {
    const fetchActiveCountries = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_weekly_contest_participants_public', { weeks_offset: 0 });
        
        if (!error && data) {
          const uniqueCountries = [...new Set(data.map((p: any) => p.country).filter(Boolean))];
          setActiveCountries(uniqueCountries as string[]);
        }
      } catch (err) {
        console.error('Error fetching active countries:', err);
      }
    };
    
    fetchActiveCountries();
  }, []);

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
    // Filter countries to only show those with active participants
    const availableCountries = ALL_COUNTRIES.filter(country => 
      activeCountries.includes(country.code)
    );
    
    const allCountries = availableCountries.map(country => {
      // Translate country name
      const translatedName = t(`country.${country.name}`) !== `country.${country.name}` 
        ? t(`country.${country.name}`) 
        : country.name;
      
      return {
        value: country.code,
        label: translatedName,
        disabled: false,
        flag: country.flag,
      };
    });
    
    // Sort alphabetically but put current country first
    const currentCountry = allCountries.find(c => c.value === countryCode);
    const otherCountries = allCountries
      .filter(c => c.value !== countryCode)
      .sort((a, b) => a.label.localeCompare(b.label));
    
    return [
      // Current country first
      ...(currentCountry ? [currentCountry] : []),
      ...(otherCountries.length > 0 ? [{ value: "__divider__", label: "", disabled: true, divider: true }] : []),
      // Other active countries
      ...otherCountries
    ];
  }, [t, activeCountries, countryCode]);

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
      <div className="[&_button]:bg-contest-light-bg [&_button]:border-contest-border [&_button:hover]:bg-contest-light-bg [&_button:hover]:border-primary [&_button]:text-contest-text [&_button:hover]:text-contest-text [&_button]:transition-colors">
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
