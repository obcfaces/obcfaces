import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Heart, Star, TrendingUp } from 'lucide-react';

export function AdminStatisticsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-statistics'],
    queryFn: async () => {
      const [participantsRes, ratingsRes, likesRes, profilesRes] = await Promise.all([
        supabase.from('weekly_contest_participants').select('id', { count: 'exact', head: true }),
        supabase.from('contestant_ratings').select('id', { count: 'exact', head: true }),
        supabase.from('likes').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalParticipants: participantsRes.count || 0,
        totalRatings: ratingsRes.count || 0,
        totalLikes: likesRes.count || 0,
        totalProfiles: profilesRes.count || 0
      };
    },
    staleTime: 60000, // 1 минута
    gcTime: 300000, // 5 минут
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Participants',
      value: stats?.totalParticipants || 0,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Total Ratings',
      value: stats?.totalRatings || 0,
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      title: 'Total Likes',
      value: stats?.totalLikes || 0,
      icon: Heart,
      color: 'text-red-500'
    },
    {
      title: 'Total Profiles',
      value: stats?.totalProfiles || 0,
      icon: TrendingUp,
      color: 'text-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
