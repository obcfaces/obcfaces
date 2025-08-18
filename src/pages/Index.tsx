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
  console.log('Index component loading...');
  
  return (
    <div className="min-h-screen p-5 bg-background text-foreground">
      <div className="bg-card p-5 rounded-lg shadow-md mb-5">
        <h1 className="text-primary text-2xl mb-4 text-center font-bold">
          🌟 OBC Faces of Philippines
        </h1>
        
        <div className="text-center mb-5">
          <p className="text-muted-foreground text-base">
            Мобильная версия с Tailwind работает! ✅
          </p>
        </div>
        
        <div className="bg-accent/50 p-4 rounded border border-border">
          <h2 className="text-primary text-lg mb-3 font-semibold">
            Навигация:
          </h2>
          <div className="flex flex-col gap-3">
            <button className="p-3 bg-primary text-primary-foreground border-none rounded text-base cursor-pointer hover:opacity-90">
              🏆 Конкурс
            </button>
            <button className="p-3 bg-secondary text-secondary-foreground border-none rounded text-base cursor-pointer hover:opacity-90">
              ❓ Как это работает
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
