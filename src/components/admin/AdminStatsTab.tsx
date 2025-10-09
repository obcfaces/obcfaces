import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Mail, TrendingUp } from 'lucide-react';
import { useProfilesQuery, useEmailDomainStats } from '@/hooks/useProfilesQuery';
import { useParticipantsQuery } from '@/hooks/useParticipantsQuery';

export const AdminStatsTab: React.FC = () => {
  const { data: profiles, isLoading: profilesLoading } = useProfilesQuery();
  const { data: participants, isLoading: participantsLoading } = useParticipantsQuery();
  const { data: emailStats, isLoading: emailStatsLoading } = useEmailDomainStats();

  const isLoading = profilesLoading || participantsLoading || emailStatsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalUsers = profiles?.length || 0;
  const verifiedUsers = profiles?.filter((p: any) => p.email_confirmed_at)?.length || 0;
  const totalParticipants = participants?.length || 0;
  const activeParticipants = participants?.filter((p: any) => p.is_active)?.length || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Statistics</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {verifiedUsers} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              {activeParticipants} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Domains</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              unique domains
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Email Domains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {emailStats?.slice(0, 10).map((stat: any) => (
              <div key={stat.domain} className="flex justify-between items-center">
                <span className="text-sm font-medium">{stat.domain}</span>
                <span className="text-sm text-muted-foreground">{stat.user_count} users</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
