import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useProfilesQuery } from '@/hooks/useProfilesQuery';

export const AdminRegistrationsTab: React.FC = () => {
  const { data: profiles, isLoading } = useProfilesQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show recent registrations (last 50)
  const recentProfiles = profiles?.slice(0, 50) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recent Registrations</h2>
        <Badge variant="secondary">{profiles?.length || 0} total users</Badge>
      </div>

      <div className="grid gap-4">
        {recentProfiles.map((profile: any) => (
          <Card key={profile.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{profile.display_name || `${profile.first_name} ${profile.last_name}`}</span>
                <div className="flex gap-2">
                  <Badge variant={profile.email_confirmed_at ? 'default' : 'secondary'}>
                    {profile.email_confirmed_at ? 'Verified' : 'Unverified'}
                  </Badge>
                  {profile.is_approved && (
                    <Badge variant="default">Approved</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  {profile.email || 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">Provider:</span>{' '}
                  {profile.auth_provider || 'email'}
                </div>
                <div>
                  <span className="text-muted-foreground">Registered:</span>{' '}
                  {new Date(profile.created_at).toLocaleDateString()}
                </div>
                {profile.ip_address && (
                  <div>
                    <span className="text-muted-foreground">IP:</span>{' '}
                    {profile.ip_address}
                    {profile.isDuplicateIP && (
                      <Badge variant="destructive" className="ml-1">Duplicate</Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {recentProfiles.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No registrations found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
