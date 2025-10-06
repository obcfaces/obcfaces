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
        console.log('=== LOADING PAST WEEK INTERVALS ===');
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
        
        console.log('Raw data from DB (count):', data?.length);
        console.log('Raw data sample:', data?.slice(0, 5));
        
        const uniqueIntervals = Array.from(new Set(data?.map(p => p.week_interval).filter(Boolean) as string[]));
        
        console.log('🔍 Unique intervals found:', uniqueIntervals);
        console.log('🔍 Total unique intervals:', uniqueIntervals.length);
        console.log('🔍 Contains 15/09-21/09/25?', uniqueIntervals.includes('15/09-21/09/25'));
        
        const currentMonday = getCurrentMonday();
        console.log('Current Monday (Philippine time):', currentMonday.toLocaleDateString('en-US'));
        
        const intervalsWithWeeks = uniqueIntervals
          .map(interval => {
            console.log(`🔧 Processing interval: ${interval}`);
            const intervalMonday = parseIntervalToMonday(interval);
            if (!intervalMonday) {
              console.log(`❌ Failed to parse interval: ${interval}`);
              return null;
            }
            
            // Calculate weeks difference
            const diffTime = currentMonday.getTime() - intervalMonday.getTime();
            const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
            const weeksAgo = Math.floor(diffDays / 7);
            
            console.log(`✅ Interval ${interval} parsed successfully:`, {
              intervalMonday: intervalMonday.toLocaleDateString('en-US'),
              currentMonday: currentMonday.toLocaleDateString('en-US'),
              diffDays,
              weeksAgo
            });
            
            return {
              interval,
              weeksAgo
            };
          })
          .filter(item => item !== null)
          .sort((a, b) => a!.weeksAgo - b!.weeksAgo) as Array<{interval: string, weeksAgo: number}>;
        
        console.log('✅ Final intervals to display:', intervalsWithWeeks);
        console.log('✅ Total intervals:', intervalsWithWeeks.length);
        intervalsWithWeeks.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.interval} (weeksAgo: ${item.weeksAgo})`);
        });
        
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
            // Add +1 to weeksAgo because THIS WEEK takes the current week slot
            const adjustedWeeksAgo = item.weeksAgo + 1;
            const weekLabel = adjustedWeeksAgo === 1 ? '1 WEEK AGO' : `${adjustedWeeksAgo} WEEKS AGO`;
            
            console.log(`🔧 Creating section: ${weekLabel}, interval: ${item.interval}, weekOffset: -${adjustedWeeksAgo}`);
            
            // Format interval for display: "06/10-12/10/25" -> "06 Oct - 12 Oct 2025"
            const formatInterval = (interval: string): string => {
              try {
                const parts = interval.split('-');
                if (parts.length !== 2) return interval;
                
                const startParts = parts[0].split('/'); // ["06", "10"]
                const endParts = parts[1].split('/');   // ["12", "10", "25"]
                
                if (startParts.length !== 2 || endParts.length !== 3) return interval;
                
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const startDay = startParts[0];
                const startMonth = months[parseInt(startParts[1]) - 1];
                const endDay = endParts[0];
                const endMonth = months[parseInt(endParts[1]) - 1];
                const year = `20${endParts[2]}`;
                
                return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
              } catch (error) {
                console.error('Error formatting interval:', error);
                return interval;
              }
            };
            
            const formattedInterval = formatInterval(item.interval);
            console.log('📅 Section details:', {
              title: weekLabel,
              subtitle: formattedInterval,
              weekInterval: item.interval,
              weekOffset: -adjustedWeeksAgo
            });
            
            return (
              <ContestSection
                key={item.interval}
                title={weekLabel}
                subtitle={formattedInterval}
                description={`See the winners from ${weekLabel.toLowerCase()}`}
                isActive={false}
                showWinner={true}
                viewMode={viewMode}
                weekOffset={-adjustedWeeksAgo}
                weekInterval={item.interval}
              />
            );
          })}
          
          {/* HARDCODED 4 WEEKS AGO SECTION - 15/09-21/09/25 */}
          <ContestSection
            key="15/09-21/09/25"
            title="4 WEEKS AGO"
            subtitle="15 Sep - 21 Sep 2025"
            description="See the winners from 4 weeks ago"
            isActive={false}
            showWinner={true}
            viewMode={viewMode}
            weekOffset={-4}
            weekInterval="15/09-21/09/25"
          />
        </div>
      </main>
    </>
  );
};

export default Contest;
