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
  const [country, setCountry] = useState<string>("PH");
  const [gender, setGender] = useState<'male' | 'female'>("female");
  const [viewMode, setViewMode] = useState<'compact' | 'full'>("compact");
  const [activeSection, setActiveSection] = useState("Contest");
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);
          
          setIsAdmin(roles?.some(role => role.role === 'admin') || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  // Инициализация category из localStorage или "" по умолчанию
  const [category, setCategory] = useState<"" | Category>(() => {
    try {
      const saved = localStorage.getItem('contest-category-filter');
      return saved !== null ? (saved as "" | Category) : "";
    } catch {
      return "";
    }
  });

  // Сохранение category в localStorage при изменении
  const handleCategoryChange = (newCategory: "" | Category) => {
    setCategory(newCategory);
    localStorage.setItem('contest-category-filter', newCategory);
  };
  
  console.log('Index component rendering, viewMode:', viewMode);
  console.log('Index state:', { country, gender, viewMode, activeSection, isAdmin, category });
  
  // Простая проверка рендеринга
  if (typeof window === 'undefined') {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ padding: '20px', color: '#000' }}>
        <h1>OBC Faces - Mobile Test</h1>
        <p>Viewmode: {viewMode}</p>
        <p>Screen width: {typeof window !== 'undefined' ? window.innerWidth : 'unknown'}</p>
        <p>Active section: {activeSection}</p>
      </div>
      
      <ContestHeader 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      {/* Content area that changes based on active section */}
      {activeSection === "Contest" && (
        <div style={{ padding: '20px' }}>
          <div className="max-w-6xl mx-auto px-6 pt-6 pb-6">
            <ContestFilters
              country={country}
              onCountryChange={setCountry}
              gender={gender}
              onGenderChange={setGender}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              category={category}
              onCategoryChange={handleCategoryChange}
              genderAvailability={{ male: false, female: true }}
            />
          </div>
          
          <NextWeekSection viewMode={viewMode} />

          <ContestSection
            title="THIS WEEK"
            subtitle="25-31 august 2025"
            description="Choose the winner of the week."
            isActive={true}
            noWrapTitle
            viewMode={viewMode}
          />
        </div>
      )}

      {/* How it works content */}
      {activeSection === "How it works" && (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">🌟 How It Works – OBC (Online Beauty Contest)</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">1. Weekly Photo Contest</h3>
              <p className="text-sm">Every week, we select the most beautiful girls from across the Philippines and post them on our site and social media.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
