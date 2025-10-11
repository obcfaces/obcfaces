import { ContestSection } from "@/components/contest-section";
import { NextWeekSection } from "@/components/next-week-section";
import { usePastWeekIntervals } from "@/hooks/usePastWeekIntervals";

interface ContestWeeksRendererProps {
  viewMode: 'compact' | 'full';
  countryCode?: string;
  timezone?: string;
}

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
    return interval;
  }
};

export const ContestWeeksRenderer = ({ 
  viewMode, 
  countryCode = "PH", 
  timezone = "Asia/Manila" 
}: ContestWeeksRendererProps) => {
  const { intervals: pastWeekIntervals } = usePastWeekIntervals(countryCode, timezone);

  return (
    <>
      <NextWeekSection viewMode={viewMode} />
      
      <section className="max-w-6xl mx-auto pt-2 mb-1 sm:mb-3 bg-background rounded-lg shadow-sm shadow-foreground/10">
        <ContestSection
          title="THIS WEEK"
          subtitle="Choose the winner"
          description="Weekly contest is live now!"
          isActive={true}
          noWrapTitle
          viewMode={viewMode}
          weekOffset={0}
        />
      </section>
      
      {/* Dynamically generate sections for all past weeks */}
      {pastWeekIntervals.map((item) => {
        const adjustedWeeksAgo = item.weeksAgo + 1;
        const weekLabel = adjustedWeeksAgo === 1 ? '1 WEEK AGO' : `${adjustedWeeksAgo} WEEKS AGO`;
        
        return (
          <ContestSection
            key={item.interval}
            title={weekLabel}
            titleSuffix="(Closed)"
            subtitle={formatInterval(item.interval)}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
            weekOffset={-adjustedWeeksAgo}
            weekInterval={item.interval}
          />
        );
      })}
    </>
  );
};
