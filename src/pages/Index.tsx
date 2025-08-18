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
  
  console.log('Index component начинает рендер');
  
  return (
    <div className="min-h-screen bg-background">
      <ContestHeader 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      {activeSection === "Contest" && (
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#e8f4fd', 
            borderRadius: '8px',
            border: '2px solid #0066cc',
            marginBottom: '20px'
          }}>
            <h2 style={{ color: '#0066cc', fontSize: '20px', marginBottom: '15px' }}>
              OBC Contest - Мобильная версия работает!
            </h2>
            <p style={{ color: '#333' }}>
              ✅ Базовая структура восстановлена
            </p>
          </div>
        </div>
      )}

      {activeSection === "How it works" && (
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">🌟 How It Works – OBC</h2>
            <p className="text-foreground">Раздел "Как это работает"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
