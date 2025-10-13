import React, { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ContestApplication } from '@/types/admin';
import { LoadingSpinner } from '../LoadingSpinner';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { UnifiedParticipantTab } from './UnifiedParticipantTab';

interface AdminNewApplicationsTabProps {
  applications: ContestApplication[];
  deletedApplications: ContestApplication[];
  showDeleted: boolean;
  onToggleDeleted: (show: boolean) => void;
  onViewPhotos: (images: string[], index: number, name: string) => void;
  onEdit: (app: ContestApplication) => void;
  onApprove: (app: ContestApplication) => void;
  onReject: (app: ContestApplication) => void;
  onDelete: (app: ContestApplication) => void;
  onRestore: (app: ContestApplication) => void;
  loading?: boolean;
}

export function AdminNewApplicationsTab({
  applications,
  deletedApplications,
  showDeleted,
  onToggleDeleted,
  onViewPhotos,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  onRestore,
  loading = false,
}: AdminNewApplicationsTabProps) {
  const { selectedCountry } = useAdminCountry();
  
  // Filter by selected country
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const country = app.application_data?.country;
      return country === selectedCountry;
    });
  }, [applications, selectedCountry]);

  const filteredDeletedApplications = useMemo(() => {
    return deletedApplications.filter(app => {
      const country = app.application_data?.country;
      return country === selectedCountry;
    });
  }, [deletedApplications, selectedCountry]);

  const displayApplications = showDeleted ? filteredDeletedApplications : filteredApplications;

  if (loading) {
    return <LoadingSpinner message="Loading applications..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-deleted-apps"
            checked={showDeleted}
            onCheckedChange={onToggleDeleted}
          />
          <label htmlFor="show-deleted-apps" className="text-sm cursor-pointer">
            Show Deleted ({deletedApplications.length})
          </label>
        </div>
      </div>

      <UnifiedParticipantTab
        participants={displayApplications}
        tabType="new"
        onViewPhotos={onViewPhotos}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestore={onRestore}
        onApprove={onApprove}
        onReject={onReject}
      />

      {displayApplications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No {showDeleted ? 'deleted' : 'new'} applications
        </div>
      )}
    </div>
  );
}
