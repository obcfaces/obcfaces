import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ContestSection } from "@/components/contest-section";
import { ContestHeader } from "@/components/contest-header";
import { NextWeekSection } from "@/components/next-week-section";

type ViewMode = 'compact' | 'full';

const Contest = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [activeSection, setActiveSection] = useState("Contest");
  
  const filters = {
    location: '',
    height: '',
    weight: '',
    age: ''
  };

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
            title="NEXT WEEK"
            subtitle="Get ready for next week"
            description="Upcoming contestants"
            isActive={false}
            showWinner={false}
            viewMode={viewMode}
            weekOffset={1}
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
