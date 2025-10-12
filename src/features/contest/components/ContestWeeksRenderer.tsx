import { ContestSection } from "./ContestSection";
import { NextWeekSection } from "./NextWeekSection";
import { usePastWeekIntervals } from "../hooks/usePastWeekIntervals";
import { VirtualizedList } from "@/components/performance/VirtualizedList";
import { useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { formatIntervalSync } from "../utils/formatInterval";

interface ContestWeeksRendererProps {
  viewMode: 'compact' | 'full';
  countryCode?: string;
  timezone?: string;
  enableVirtualization?: boolean;
}


export const ContestWeeksRenderer = ({ 
  viewMode, 
  countryCode = "PH", 
  timezone = "Asia/Manila",
  enableVirtualization = true
}: ContestWeeksRendererProps) => {
  const { t } = useTranslation();
  const { intervals: pastWeekIntervals } = usePastWeekIntervals(countryCode, timezone);

  // Prepare past week items for virtualization
  const pastWeekItems = useMemo(() => {
    return pastWeekIntervals.map((item) => {
      const adjustedWeeksAgo = item.weeksAgo + 1;
      const weekLabel = adjustedWeeksAgo === 1 ? t('1 WEEK AGO') : t(`${adjustedWeeksAgo} WEEKS AGO`);
      
      return {
        id: item.interval,
        component: (
          <ContestSection
            key={item.interval}
            title={weekLabel}
            titleSuffix={t("(Closed)")}
            subtitle={formatIntervalSync(item.interval)}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
            weekOffset={-adjustedWeeksAgo}
            weekInterval={item.interval}
          />
        )
      };
    });
  }, [pastWeekIntervals, viewMode, t]);

  return (
    <>
      <NextWeekSection viewMode={viewMode} />
      
      <section className="max-w-6xl mx-auto pt-2 mb-1 sm:mb-3 bg-background rounded-lg shadow-sm shadow-foreground/10">
        <ContestSection
          title={t("THIS WEEK")}
          subtitle={t("Choose the winner")}
          description={t("Weekly contest is live now!")}
          isActive={true}
          noWrapTitle
          viewMode={viewMode}
          weekOffset={0}
        />
      </section>
      
      {/* Past weeks - regular rendering to prevent overlapping */}
      <div className="space-y-4">
        {pastWeekItems.map(item => (
          <div key={item.id} className="w-full">
            {item.component}
          </div>
        ))}
      </div>
    </>
  );
};
