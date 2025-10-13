import { ContestSection } from "./ContestSection";
import { NextWeekSection } from "./NextWeekSection";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getWeekRange } from "@/utils/dateFormatting";
import { supabase } from "@/integrations/supabase/client";
import { usePastWeekIntervals } from "../hooks/usePastWeekIntervals";
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
  const { currentLanguage } = useLanguage();
  const [thisWeekInterval, setThisWeekInterval] = useState<string>("");
  
  // Load real past week intervals from database
  const { intervals: pastWeekIntervals, loading: pastWeeksLoading } = usePastWeekIntervals(countryCode, timezone);

  // Get actual THIS WEEK interval from database
  useEffect(() => {
    const fetchThisWeekInterval = async () => {
      const { data } = await supabase
        .from('weekly_contest_participants')
        .select('week_interval')
        .eq('admin_status', 'this week')
        .eq('is_active', true)
        .is('deleted_at', null)
        .limit(1)
        .single();
      
      if (data?.week_interval) {
        setThisWeekInterval(data.week_interval);
      } else {
        // Fallback to calculated interval if no data
        setThisWeekInterval(getWeekRange(0, currentLanguage.code));
      }
    };
    
    fetchThisWeekInterval();
  }, [currentLanguage.code]);

  // Prepare past week items using real intervals from database
  const pastWeekItems = useMemo(() => {
    if (pastWeeksLoading) return [];
    
    return pastWeekIntervals.map((item) => {
      const weekLabel = item.weeksAgo === 1 ? t('1 WEEK AGO') : t(`${item.weeksAgo} WEEKS AGO`);
      const displayInterval = formatIntervalSync(item.interval); // Format for display: "13-19 Oct 2025"
      
      return {
        id: item.interval,
        component: (
          <ContestSection
            key={item.interval}
            title={weekLabel}
            titleSuffix={t("(Closed)")}
            subtitle={displayInterval}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
            weekOffset={-item.weeksAgo}
            weekInterval={item.interval} // Use database format: "06/10-12/10/25"
            countryCode={countryCode}
          />
        )
      };
    });
  }, [pastWeekIntervals, pastWeeksLoading, viewMode, t, countryCode]);

  return (
    <>
      <NextWeekSection viewMode={viewMode} countryCode={countryCode} />
      
      <ContestSection
        title={t("THIS WEEK")}
        subtitle={thisWeekInterval || getWeekRange(0, currentLanguage.code)}
        description={t("Choose the winner")}
        isActive={true}
        noWrapTitle
        viewMode={viewMode}
        weekOffset={0}
        countryCode={countryCode}
      />
      
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
