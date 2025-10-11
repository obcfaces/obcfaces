import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, Vote, Globe, Clock } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RegistrationData {
  day: string;
  signups: number;
}


interface VotingData {
  day: string;
  votes: number;
  avg_rating: number;
}

interface CountryData {
  country: string;
  user_count: number;
}

interface MetricsData {
  totalUsers: number;
  totalVotes: number;
  totalParticipants: number;
  todayRegistrations: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function AdminAnalyticsDashboard() {
  // Fetch key metrics from analytics views
  const { data: conversionMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-analytics-conversion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_conversion_metrics')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      
      return {
        totalUsers: data?.total_users || 0,
        weeklyVoters: data?.weekly_voters || 0,
        todayRegistrations: data?.today_registrations || 0,
        conversionRate: data?.conversion_rate || 0,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const { data: totalVotes } = useQuery({
    queryKey: ['admin-analytics-total-votes'],
    queryFn: async () => {
      const { count } = await supabase
        .from('contestant_ratings')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
    staleTime: 60 * 1000,
  });

  const { data: totalParticipants } = useQuery({
    queryKey: ['admin-analytics-total-participants'],
    queryFn: async () => {
      const { count } = await supabase
        .from('weekly_contest_participants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      return count || 0;
    },
    staleTime: 60 * 1000,
  });

  // Fetch registration trend from analytics view
  const { data: registrationTrend } = useQuery<RegistrationData[]>({
    queryKey: ['admin-analytics-registration-trend'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_registrations_per_day')
        .select('*')
        .order('day', { ascending: true })
        .limit(30);

      if (error) throw error;

      return (data || []).map(item => ({
        day: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        signups: item.signups,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch voting activity from analytics view
  const { data: votingTrend } = useQuery<VotingData[]>({
    queryKey: ['admin-analytics-voting-trend'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_votes_per_day')
        .select('*')
        .order('day', { ascending: true })
        .limit(30);

      if (error) throw error;

      return (data || []).map(item => ({
        day: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        votes: item.votes,
        avg_rating: item.avg_rating ? parseFloat(String(item.avg_rating)) : 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch geographic distribution from analytics view
  const { data: geoData } = useQuery<CountryData[]>({
    queryKey: ['admin-analytics-geo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_top_countries_week')
        .select('*')
        .limit(10);

      if (error) throw error;
      
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionMetrics?.totalUsers.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{conversionMetrics?.todayRegistrations || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVotes?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              All-time voting activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants || 0}</div>
            <p className="text-xs text-muted-foreground">
              Current contest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3m 42s</div>
            <p className="text-xs text-muted-foreground">
              Target: 5m+
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Registration Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={registrationTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="signups" stroke="hsl(var(--primary))" strokeWidth={2} name="Registrations" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voting Activity (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={votingTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="votes" fill="hsl(var(--primary))" name="Votes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={geoData as any[] || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.country}: ${entry.user_count}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="user_count"
                  nameKey="country"
                >
                  {(geoData || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Targets (Q4 2025)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Conversion to Vote</span>
                <span className="font-semibold">Target: +25%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Session Duration</span>
                <span className="font-semibold">Target: 5m+</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '74%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>LCP Performance</span>
                <span className="font-semibold text-green-600">✅ 2.1s</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Error Rate</span>
                <span className="font-semibold text-green-600">✅ 0.2%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
