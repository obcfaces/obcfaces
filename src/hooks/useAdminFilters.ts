import { useState, useMemo } from 'react';

interface FilterState {
  countryFilter: string;
  genderFilter: string;
  adminStatusFilter: string;
  registrationsStatusFilter: string;
  allSectionStatusFilter: string;
}

export const useAdminFilters = () => {
  const [filters, setFilters] = useState<FilterState>({
    countryFilter: 'all',
    genderFilter: 'all',
    adminStatusFilter: 'all',
    registrationsStatusFilter: 'all',
    allSectionStatusFilter: 'all'
  });

  const setCountryFilter = (value: string) => {
    setFilters(prev => ({ ...prev, countryFilter: value }));
  };

  const setGenderFilter = (value: string) => {
    setFilters(prev => ({ ...prev, genderFilter: value }));
  };

  const setAdminStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, adminStatusFilter: value }));
  };

  const setRegistrationsStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, registrationsStatusFilter: value }));
  };

  const setAllSectionStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, allSectionStatusFilter: value }));
  };

  const resetFilters = () => {
    setFilters({
      countryFilter: 'all',
      genderFilter: 'all',
      adminStatusFilter: 'all',
      registrationsStatusFilter: 'all',
      allSectionStatusFilter: 'all'
    });
  };

  return {
    ...filters,
    setCountryFilter,
    setGenderFilter,
    setAdminStatusFilter,
    setRegistrationsStatusFilter,
    setAllSectionStatusFilter,
    resetFilters
  };
};
