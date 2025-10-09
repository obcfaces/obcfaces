import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProfileData } from '@/types/admin';
import { Facebook, Shield, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expandedFingerprint, setExpandedFingerprint] = useState<string | null>(null);

  const filteredProfiles = profiles.filter(profile => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return profile.is_approved === null;
    if (statusFilter === 'approved') return profile.is_approved === true;
    if (statusFilter === 'rejected') return profile.is_approved === false;
    return true;
  });

  // Calculate fingerprint counts
  const fingerprintCounts = useMemo(() => {
    const counts = new Map<string, number>();
    profiles.forEach(profile => {
      if (profile.fingerprint_id) {
        counts.set(profile.fingerprint_id, (counts.get(profile.fingerprint_id) || 0) + 1);
      }
    });
    return counts;
  }, [profiles]);

  // Get profiles with same fingerprint
  const getProfilesWithFingerprint = (fingerprintId: string) => {
    return profiles.filter(p => p.fingerprint_id === fingerprintId);
  };

  const toggleFingerprintExpand = (fingerprintId: string, profileId: string) => {
    if (expandedFingerprint === `${fingerprintId}-${profileId}`) {
      setExpandedFingerprint(null);
    } else {
      setExpandedFingerprint(`${fingerprintId}-${profileId}`);
    }
  };

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
            <Card key={profile.id} className="group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{fullName}</CardTitle>
                  <div className="flex items-center gap-2">
                    {profile.auth_provider === 'facebook' && (
                      <Facebook className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1">
                    {profile.email || 'No email'}
                    {profile.email && (
                      <button
                        onClick={() => navigator.clipboard.writeText(profile.email)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        📋
                      </button>
                    )}
                  </p>
                  
                  {profile.ip_address && (
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className={profile.isDuplicateIP ? 'text-blue-600 font-medium' : ''}>
                        IP: {profile.ip_address}
                        {profile.isDuplicateIP && ' (duplicate)'}
                      </span>
                    </p>
                  )}

                  {profile.fingerprint_id && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleFingerprintExpand(profile.fingerprint_id!, profile.id)}
                        className="flex items-center gap-1 text-sm hover:underline"
                      >
                        <span className={fingerprintCounts.get(profile.fingerprint_id)! > 1 ? 'text-blue-600 font-medium' : 'text-muted-foreground'}>
                          {profile.auth_provider === 'facebook' ? 'Facebook' : 'mobile'} | {profile.device_info || 'Unknown device'} | fp {profile.fingerprint_id.substring(0, 8)}
                          {fingerprintCounts.get(profile.fingerprint_id)! > 1 && (
                            <span className="ml-1">({fingerprintCounts.get(profile.fingerprint_id)})</span>
                          )}
                        </span>
                        {fingerprintCounts.get(profile.fingerprint_id)! > 1 && (
                          expandedFingerprint === `${profile.fingerprint_id}-${profile.id}` 
                            ? <ChevronUp className="h-3 w-3" />
                            : <ChevronDown className="h-3 w-3" />
                        )}
                      </button>

                      {expandedFingerprint === `${profile.fingerprint_id}-${profile.id}` && 
                       fingerprintCounts.get(profile.fingerprint_id)! > 1 && (
                        <div className="ml-4 pl-3 border-l-2 border-blue-200 space-y-2">
                          {getProfilesWithFingerprint(profile.fingerprint_id!)
                            .filter(p => p.id !== profile.id)
                            .map(matchedProfile => {
                              const matchedName = matchedProfile.display_name || 
                                `${matchedProfile.first_name || ''} ${matchedProfile.last_name || ''}`.trim() || 
                                'Unknown';
                              return (
                                <div key={matchedProfile.id} className="text-xs text-muted-foreground">
                                  <p className="font-medium text-blue-600">{matchedName}</p>
                                  <p>{matchedProfile.email}</p>
                                  <p>{matchedProfile.ip_address}</p>
                                  <p className="text-[10px]">
                                    {new Date(matchedProfile.last_sign_in_at || matchedProfile.created_at).toLocaleString()}
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  <p>{profile.age} • {profile.gender}</p>
                  <p>{profile.city}, {profile.country}</p>
                  
                  {profile.last_sign_in_at && (
                    <p className="text-xs text-muted-foreground">
                      Last login: {new Date(profile.last_sign_in_at).toLocaleString()}
                    </p>
                  )}
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
