import { ContestSection } from "./ContestSection";
import { NextWeekSection } from "./NextWeekSection";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getWeekRange } from "@/utils/dateFormatting";
import { supabase } from "@/integrations/supabase/client";

interface ContestWeeksRendererProps {
  viewMode: 'compact' | 'full';
  countryCode?: string;
  timezone?: string;
  enableVirtualization?: boolean;
}


// Calculate dynamic past weeks based on current Monday
const calculatePastWeeks = () => {
  const now = new Date();
  const currentMonday = new Date(now);
  const dayOfWeek = currentMonday.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  currentMonday.setDate(currentMonday.getDate() + daysToMonday);
  currentMonday.setHours(0, 0, 0, 0);
  
  const weeks = [];
  for (let i = 1; i <= 5; i++) {
    const monday = new Date(currentMonday);
    monday.setDate(currentMonday.getDate() - (i * 7));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    const formatYear = (d: Date) => String(d.getFullYear()).slice(-2);
    const interval = `${formatDate(monday)}-${formatDate(sunday)}/${formatYear(sunday)}`;
    
    weeks.push({ interval, weeksAgo: i });
  }
  return weeks;
};

export const ContestWeeksRenderer = ({ 
  viewMode, 
  countryCode = "PH", 
  timezone = "Asia/Manila",
  enableVirtualization = true
}: ContestWeeksRendererProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [thisWeekInterval, setThisWeekInterval] = useState<string>("");

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

  // Prepare past week items using dynamically calculated weeks
  const pastWeekItems = useMemo(() => {
    const pastWeeks = calculatePastWeeks();
    
    return pastWeeks.map((item) => {
      const weekLabel = item.weeksAgo === 1 ? t('1 WEEK AGO') : t(`${item.weeksAgo} WEEKS AGO`);
      
      return {
        id: item.interval,
        component: (
          <ContestSection
            key={item.interval}
            title={weekLabel}
            titleSuffix={t("(Closed)")}
            subtitle={item.interval}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
            weekOffset={-item.weeksAgo}
            weekInterval={item.interval}
            countryCode={countryCode}
          />
        )
      };
    });
  }, [viewMode, t, countryCode]);

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
