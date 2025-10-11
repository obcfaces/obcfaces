import React, { createContext, useContext, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CONTEST_COUNTRIES } from '@/types/admin';
import { getCountryCapitalTimezone } from '@/utils/weekIntervals';

interface PublicCountryContextType {
  countryCode: string;
  countryName: string;
  timezone: string;
  flag: string;
  navigateToCountry: (code: string) => void;
}

const PublicCountryContext = createContext<PublicCountryContextType | undefined>(undefined);

export const PublicCountryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { country } = useParams<{ country: string }>();
  const navigate = useNavigate();
  
  // Default to PH if no country in URL
  const countryCode = country?.toUpperCase() || 'PH';
  
  // Find country config
  const countryConfig = CONTEST_COUNTRIES.find(c => c.code === countryCode) || CONTEST_COUNTRIES[0];
  
  const timezone = getCountryCapitalTimezone(countryCode);

  const navigateToCountry = (code: string) => {
    navigate(`/${code.toLowerCase()}`);
  };

  return (
    <PublicCountryContext.Provider
      value={{
        countryCode,
        countryName: countryConfig.name,
        timezone,
        flag: countryConfig.flag,
        navigateToCountry,
      }}
    >
      {children}
    </PublicCountryContext.Provider>
  );
};

export const usePublicCountry = () => {
  const context = useContext(PublicCountryContext);
  if (context === undefined) {
    throw new Error('usePublicCountry must be used within PublicCountryProvider');
  }
  return context;
};
