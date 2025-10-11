import { useState, useMemo } from 'react';

interface FilterState {
  genderFilter: string;
  adminStatusFilter: string;
  registrationsStatusFilter: string;
  allSectionStatusFilter: string;
}

export const useAdminFilters = () => {
  const [filters, setFilters] = useState<FilterState>({
    genderFilter: 'all',
    adminStatusFilter: 'all',
    registrationsStatusFilter: 'all',
    allSectionStatusFilter: 'all'
  });

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
      genderFilter: 'all',
      adminStatusFilter: 'all',
      registrationsStatusFilter: 'all',
      allSectionStatusFilter: 'all'
    });
  };

  return {
    ...filters,
    setGenderFilter,
    setAdminStatusFilter,
    setRegistrationsStatusFilter,
    setAllSectionStatusFilter,
    resetFilters
  };
};
