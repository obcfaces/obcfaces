import { useState, useEffect } from "react";

import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";
import { NextWeekSection } from "@/components/next-week-section";
import ContestFilters from "@/components/contest-filters";
import AiChat from "@/components/ai-chat";
import { EditableContent } from "@/components/editable-content";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/components/contest-filters";

const Index = () => {
  const [activeSection, setActiveSection] = useState("Contest");
  
  console.log('Index component loading...');
  
  return (
    <div className="min-h-screen bg-background">
      <ContestHeader 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      {activeSection === "Contest" && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="bg-card p-4 sm:p-5 rounded-lg shadow-md mb-5">
            <h1 className="text-primary text-xl sm:text-2xl mb-4 text-center font-bold">
              🏆 OBC Contest - This Week
            </h1>
            <p className="text-center text-muted-foreground text-sm sm:text-base">
              Основной функционал постепенно восстанавливается ✅
            </p>
          </div>
        </div>
      )}

      {activeSection === "How it works" && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">🌟 How It Works – OBC</h2>
            <p className="text-muted-foreground text-sm sm:text-base">Раздел "Как это работает"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
