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
    
    checkAdminStatus();
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

  if (!isAdmin) {
    return (
      <>
        <Helmet>
          <title>Contest – Access Restricted</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h1 className="text-3xl font-bold mb-4">Access Restricted</h1>
            <p className="text-muted-foreground mb-6">
              This page is only available to administrators.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </main>
      </>
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
          
          <ContestSection
            title="1 WEEK AGO"
            subtitle="Previous week results"
            description="See who won last week"
            isActive={false}
            showWinner={true}
            viewMode={viewMode}
            weekOffset={-1}
          />
          
          <ContestSection
            title="2 WEEKS AGO"
            subtitle="Two weeks ago results"
            description="See the winners from 2 weeks ago"
            isActive={false}
            showWinner={true}
            viewMode={viewMode}
            weekOffset={-2}
          />
          
          <ContestSection
            title="3 WEEKS AGO"
            subtitle="Three weeks ago results"
            description="See the winners from 3 weeks ago"
            isActive={false}
            showWinner={true}
            viewMode={viewMode}
            weekOffset={-3}
          />
        </div>
      </main>
    </>
  );
};

export default Contest;
