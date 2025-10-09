import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type StatType = 'country' | 'ip' | 'device' | 'os' | 'email';

export function AdminStatisticsTab() {
  const [statType, setStatType] = useState<StatType>('country');
  const [statsData, setStatsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [statType]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      if (statType === 'email') {
        const { data, error } = await supabase.rpc('get_email_domain_stats');
        if (data) {
          const formattedData = data.map((item: any) => ({
            name: item.domain,
            count: item.user_count,
          }));
          setStatsData(formattedData);
        }
      } else {
        // Placeholder for other stat types
        setStatsData([]);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Statistics</h2>
        <Select value={statType} onValueChange={(value) => setStatType(value as StatType)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select stat type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="country">By Country</SelectItem>
            <SelectItem value="ip">By IP Address</SelectItem>
            <SelectItem value="device">By Device</SelectItem>
            <SelectItem value="os">By OS</SelectItem>
            <SelectItem value="email">By Email Domain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {statType === 'country' && 'Registrations by Country'}
            {statType === 'ip' && 'Registrations by IP Address'}
            {statType === 'device' && 'Registrations by Device'}
            {statType === 'os' && 'Registrations by Operating System'}
            {statType === 'email' && 'Registrations by Email Domain'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : statsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={statsData.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
