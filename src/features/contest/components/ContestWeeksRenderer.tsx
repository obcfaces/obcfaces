import { ContestSection } from "./ContestSection";
import { NextWeekSection } from "./NextWeekSection";
import { useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getWeekRange } from "@/utils/dateFormatting";

interface ContestWeeksRendererProps {
  viewMode: 'compact' | 'full';
  countryCode?: string;
  timezone?: string;
  enableVirtualization?: boolean;
}


// Fixed week intervals mapping
const FIXED_WEEK_INTERVALS = [
  { interval: '06/10-12/10/25', weeksAgo: 1 },
  { interval: '29/09-05/10/25', weeksAgo: 2 },
  { interval: '22/09-28/09/25', weeksAgo: 3 },
  { interval: '15/09-21/09/25', weeksAgo: 4 },
  { interval: '08/09-14/09/25', weeksAgo: 5 },
];

export const ContestWeeksRenderer = ({ 
  viewMode, 
  countryCode = "PH", 
  timezone = "Asia/Manila",
  enableVirtualization = true
}: ContestWeeksRendererProps) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  // Prepare past week items using fixed intervals
  const pastWeekItems = useMemo(() => {
    return FIXED_WEEK_INTERVALS.map((item) => {
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
        subtitle={getWeekRange(0, currentLanguage.code)}
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
