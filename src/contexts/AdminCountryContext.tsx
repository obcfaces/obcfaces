import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CONTEST_COUNTRIES } from '@/types/admin';
import { getCountryCapitalTimezone, getStrictWeekInterval } from '@/utils/weekIntervals';

interface AdminCountryContextType {
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  timezone: string;
  getCurrentTime: () => Date;
  getCurrentWeekInterval: () => string;
}

const AdminCountryContext = createContext<AdminCountryContextType | undefined>(undefined);

export const AdminCountryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCountry, setSelectedCountryState] = useState<string>(() => {
    // Load from localStorage or default to 'PH'
    const saved = localStorage.getItem('admin_selected_country');
    return saved || 'PH';
  });

  const timezone = getCountryCapitalTimezone(selectedCountry);

  const setSelectedCountry = (country: string) => {
    setSelectedCountryState(country);
    localStorage.setItem('admin_selected_country', country);
  };

  const getCurrentTime = (): Date => {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', { timeZone: timezone });
    return new Date(timeString);
  };

  const getCurrentWeekInterval = (): string => {
    const now = getCurrentTime();
    const interval = getStrictWeekInterval(now, selectedCountry);
    return interval.formatted;
  };

  return (
    <AdminCountryContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        timezone,
        getCurrentTime,
        getCurrentWeekInterval,
      }}
    >
      {children}
    </AdminCountryContext.Provider>
  );
};

export const useAdminCountry = () => {
  const context = useContext(AdminCountryContext);
  if (context === undefined) {
    throw new Error('useAdminCountry must be used within AdminCountryProvider');
  }
  return context;
};
