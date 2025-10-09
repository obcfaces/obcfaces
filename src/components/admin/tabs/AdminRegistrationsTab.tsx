import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProfileData } from '@/types/admin';
import { Facebook, Shield, AlertCircle } from 'lucide-react';

interface AdminRegistrationsTabProps {
  profiles: ProfileData[];
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onApprove: (profile: ProfileData) => void;
  onReject: (profile: ProfileData) => void;
}

export function AdminRegistrationsTab({
  profiles,
  statusFilter,
  onStatusFilterChange,
  onApprove,
  onReject,
}: AdminRegistrationsTabProps) {
  const filteredProfiles = profiles.filter(profile => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return profile.is_approved === null;
    if (statusFilter === 'approved') return profile.is_approved === true;
    if (statusFilter === 'rejected') return profile.is_approved === false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Registrations</h2>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProfiles.map((profile) => {
          const fullName = profile.display_name || 
            `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
            'Unknown';

          return (
            <Card key={profile.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{fullName}</CardTitle>
                  <div className="flex items-center gap-2">
                    {profile.auth_provider === 'facebook' && (
                      <Facebook className="h-4 w-4 text-blue-600" />
                    )}
                    {profile.isDuplicateIP && (
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">{profile.email || 'No email'}</p>
                  <p>{profile.age} • {profile.gender}</p>
                  <p>{profile.city}, {profile.country}</p>
                </div>

                {profile.is_approved === null && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => onApprove(profile)}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => onReject(profile)}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {profile.is_approved === true && (
                  <Badge variant="default">Approved</Badge>
                )}
                {profile.is_approved === false && (
                  <Badge variant="destructive">Rejected</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No registrations found
        </div>
      )}
    </div>
  );
}
