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
  const [pastWeekIntervals, setPastWeekIntervals] = useState<string[]>([]);
  const navigate = useNavigate();
  
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
        
        // Get unique intervals and sort them (newest first)
        const uniqueIntervals = Array.from(new Set(data?.map(p => p.week_interval).filter(Boolean) as string[]));
        
        // Sort by date (parse DD/MM-DD/MM/YY format)
        const sortedIntervals = uniqueIntervals.sort((a, b) => {
          // Extract end date from format "DD/MM-DD/MM/YY"
          const getEndDate = (interval: string) => {
            const parts = interval.split('-');
            if (parts.length !== 2) return new Date(0);
            
            const [dayMonth, yearPart] = parts[1].split('/');
            const day = parseInt(dayMonth);
            const month = parseInt(parts[1].split('/')[0]);
            const year = 2000 + parseInt(parts[1].split('/')[2]);
            
            return new Date(year, month - 1, day);
          };
          
          return getEndDate(b).getTime() - getEndDate(a).getTime();
        });
        
        console.log('Past week intervals:', sortedIntervals);
        setPastWeekIntervals(sortedIntervals);
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
          {pastWeekIntervals.map((interval, index) => {
            const weekNumber = index + 1;
            const weekLabel = weekNumber === 1 ? '1 WEEK AGO' : `${weekNumber} WEEKS AGO`;
            
            return (
              <ContestSection
                key={interval}
                title={weekLabel}
                subtitle={`${weekLabel.toLowerCase()} results`}
                description={`See the winners from ${weekLabel.toLowerCase()}`}
                isActive={false}
                showWinner={true}
                viewMode={viewMode}
                weekOffset={-weekNumber}
                weekInterval={interval}
              />
            );
          })}
        </div>
      </main>
    </>
  );
};

export default Contest;
