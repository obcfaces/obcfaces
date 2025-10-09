import React from 'react';
import { AllParticipantsTable } from '@/components/admin/AllParticipantsTable';

export function AdminAllParticipantsTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">All Participants</h2>
      
      <AllParticipantsTable />
    </div>
  );
}
