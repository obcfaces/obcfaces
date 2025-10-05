import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { ContestSection } from "@/components/contest-section";
import { ContestHeader } from "@/components/contest-header";
import { NextWeekSection } from "@/components/next-week-section";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type ViewMode = 'compact' | 'full';

const Contest = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [activeSection, setActiveSection] = useState("Contest");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pastWeekIntervals, setPastWeekIntervals] = useState<Array<{interval: string, weeksAgo: number}>>([]);
  const navigate = useNavigate();
  
  // Helper function to get current Monday in Philippine time
  const getCurrentMonday = () => {
    const now = new Date();
    const philippineTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const currentDayOfWeek = philippineTime.getDay();
    const daysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const currentMonday = new Date(philippineTime);
    currentMonday.setDate(philippineTime.getDate() - daysToSubtract);
    currentMonday.setHours(0, 0, 0, 0);
    return currentMonday;
  };
  
  // Helper function to parse week_interval and get the Monday date
  const parseIntervalToMonday = (interval: string): Date | null => {
    try {
      // Format: "DD/MM-DD/MM/YY"
      const parts = interval.split('-');
      if (parts.length !== 2) return null;
      
      // First part is "DD/MM" (Monday)
      const startParts = parts[0].split('/');
      if (startParts.length !== 2) return null;
      
      // Second part is "DD/MM/YY" (Sunday) - we get year from here
      const endParts = parts[1].split('/');
      if (endParts.length !== 3) return null;
      
      const day = parseInt(startParts[0]);
      const month = parseInt(startParts[1]) - 1; // JS months are 0-indexed
      const year = parseInt(endParts[2]);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      
      return new Date(fullYear, month, day, 0, 0, 0, 0);
    } catch (error) {
      console.error('Error parsing interval:', interval, error);
      return null;
    }
  };
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);
          
          setIsAdmin(roles?.some(role => role.role === 'admin') || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const loadPastWeekIntervals = async () => {
      try {
        console.log('Loading past week intervals...');
        // Get all unique week_interval values from past participants
        const { data, error } = await supabase
          .from('weekly_contest_participants')
          .select('week_interval')
          .eq('admin_status', 'past')
          .eq('is_active', true)
          .is('deleted_at', null);
        
        if (error) {
          console.error('Error loading past week intervals:', error);
          return;
        }
        
        console.log('Raw data from DB:', data);
        
        // Get unique intervals
        const uniqueIntervals = Array.from(new Set(data?.map(p => p.week_interval).filter(Boolean) as string[]));
        
        console.log('Unique intervals before processing:', uniqueIntervals);
        
        // Get current Monday in Philippine time
        const currentMonday = getCurrentMonday();
        console.log('Current Monday (Philippine time):', currentMonday);
        
        // Calculate weeks difference for each interval
        const intervalsWithWeeks = uniqueIntervals
          .map(interval => {
            const intervalMonday = parseIntervalToMonday(interval);
            if (!intervalMonday) return null;
            
            // Calculate difference in weeks
            const diffTime = currentMonday.getTime() - intervalMonday.getTime();
            const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
            
            console.log(`Interval ${interval}: Monday=${intervalMonday}, WeeksAgo=${diffWeeks}`);
            
            return {
              interval,
              weeksAgo: diffWeeks
            };
          })
          .filter(item => item !== null && item.weeksAgo > 0) // Only past weeks
          .sort((a, b) => a!.weeksAgo - b!.weeksAgo) as Array<{interval: string, weeksAgo: number}>;
        
        console.log('Past week intervals with weeks calculation:', intervalsWithWeeks);
        setPastWeekIntervals(intervalsWithWeeks);
      } catch (error) {
        console.error('Error loading past week intervals:', error);
      }
    };
    
    checkAdminStatus();
    loadPastWeekIntervals();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }


  return (
    <>
      <Helmet>
        <title>Contest – Weekly Entries</title>
        <meta name="description" content="Browse weekly contest entries and finalists." />
        <link rel="canonical" href="/contest" />
      </Helmet>

      <main className="min-h-screen bg-background">
        <ContestHeader activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <div className="space-y-8">
          <NextWeekSection viewMode={viewMode} />
          
          <ContestSection
            title="THIS WEEK"
            subtitle="Help us choose the winner"
            description="Weekly contest is live now!"
            isActive={true}
            showWinner={false}
            viewMode={viewMode}
            weekOffset={0}
          />
          
          {/* Dynamically generate sections for all past weeks */}
          {pastWeekIntervals.map((item) => {
            const weekLabel = item.weeksAgo === 1 ? '1 WEEK AGO' : `${item.weeksAgo} WEEKS AGO`;
            
            return (
              <ContestSection
                key={item.interval}
                title={weekLabel}
                subtitle={`${weekLabel.toLowerCase()} results`}
                description={`See the winners from ${weekLabel.toLowerCase()}`}
                isActive={false}
                showWinner={true}
                viewMode={viewMode}
                weekOffset={-item.weeksAgo}
                weekInterval={item.interval}
              />
            );
          })}
        </div>
      </main>
    </>
  );
};

export default Contest;
