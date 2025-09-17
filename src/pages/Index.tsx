import { useState, useEffect } from "react";

// REMOVE MORE IMPORTS TO ISOLATE RECURSION
// import { ContestHeader } from "@/components/contest-header";
// import { ContestSection } from "@/components/contest-section"; // Add back gradually
// import ContestFilters from "@/components/contest-filters";
// import { EditableContent } from "@/components/editable-content";
// import { supabase } from "@/integrations/supabase/client";
// import type { Category } from "@/components/contest-filters";

// Helper function to get week range dates (Monday-Sunday)
const getWeekRange = (weeksOffset: number = 0) => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Get Monday of current week
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + (weeksOffset * 7));
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatDate = (date: Date, includeYear: boolean = false) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
  };
  
  const mondayFormatted = formatDate(monday);
  const sundayFormatted = formatDate(sunday, true);
  
  // If same month, show "1-7 September 2025", otherwise "31 August - 6 September 2025"
  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getDate()}-${sunday.getDate()} ${sunday.toLocaleDateString('en-US', { month: 'long' })} ${sunday.getFullYear()}`;
  } else {
    return `${mondayFormatted} - ${sundayFormatted}`;
  }
};

const Index = () => {
  const [activeSection, setActiveSection] = useState("Contest");
  
  console.log('Index component rendering - further simplified');
  
  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <h1 className="text-2xl font-bold">Further Simplified Index</h1>
        <p>Active section: {activeSection}</p>
        <p>Testing without any problematic imports</p>
      </div>
    </div>
  );
};

export default Index;
