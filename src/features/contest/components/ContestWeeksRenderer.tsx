import { ContestSection } from "./ContestSection";
import { NextWeekSection } from "./NextWeekSection";
import { usePastWeekIntervals } from "../hooks/usePastWeekIntervals";
import { VirtualizedList } from "@/components/performance/VirtualizedList";
import { useMemo } from "react";

interface ContestWeeksRendererProps {
  viewMode: 'compact' | 'full';
  countryCode?: string;
  timezone?: string;
  enableVirtualization?: boolean;
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
  timezone = "Asia/Manila",
  enableVirtualization = true
}: ContestWeeksRendererProps) => {
  const { intervals: pastWeekIntervals } = usePastWeekIntervals(countryCode, timezone);

  // Prepare past week items for virtualization
  const pastWeekItems = useMemo(() => {
    return pastWeekIntervals.map((item) => {
      const adjustedWeeksAgo = item.weeksAgo + 1;
      const weekLabel = adjustedWeeksAgo === 1 ? '1 WEEK AGO' : `${adjustedWeeksAgo} WEEKS AGO`;
      
      return {
        id: item.interval,
        component: (
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
        )
      };
    });
  }, [pastWeekIntervals, viewMode]);

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
      
      {/* Virtualized past weeks for performance */}
      {enableVirtualization && pastWeekItems.length > 3 ? (
        <VirtualizedList
          items={pastWeekItems}
          itemHeight={600}
          containerHeight={800}
          renderItem={(item) => item.component}
        />
      ) : (
        // Fallback to regular rendering for small lists
        pastWeekItems.map(item => item.component)
      )}
    </>
  );
};
