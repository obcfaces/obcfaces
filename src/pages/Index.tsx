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
    <div className="min-h-screen bg-white text-black p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">
        🏆 OBC Contest - This Week
      </h1>
      <p className="text-center">
        Основной функционал постепенно восстанавливается ✅
      </p>
    </div>
  );
};

export default Index;
