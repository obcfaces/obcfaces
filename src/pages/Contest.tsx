import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ContestSection } from "@/components/contest-section";
import { ContestHeader } from "@/components/contest-header";
import { NextWeekSection } from "@/components/next-week-section";
import { PublicCountryProvider, usePublicCountry } from "@/contexts/PublicCountryContext";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { usePastWeekIntervals } from "@/hooks/usePastWeekIntervals";

type ViewMode = 'compact' | 'full';

const ContestContent = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [activeSection, setActiveSection] = useState("Contest");
  const { countryCode, timezone } = usePublicCountry();
  
  // Use optimized hooks
  const { isAdmin, loading } = useAdminStatus();
  const { intervals: pastWeekIntervals, loading: intervalsLoading } = usePastWeekIntervals(countryCode, timezone);

  if (loading || intervalsLoading) {
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
            
            const formatInterval = (interval: string): string => {
              try {
                const parts = interval.split('-');
                if (parts.length !== 2) return interval;
                
                const startParts = parts[0].split('/');
                const endParts = parts[1].split('/');
                
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
        </div>
      </main>
    </>
  );
};

const Contest = () => {
  return (
    <PublicCountryProvider>
      <ContestContent />
    </PublicCountryProvider>
  );
};

export default Contest;
