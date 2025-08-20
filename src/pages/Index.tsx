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
  return (
    <div className="min-h-screen bg-background">
      <ContestHeader 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      {/* Content area that changes based on active section */}
      {activeSection === "Contest" && (
        <>
          <div className="max-w-6xl mx-auto px-6 pt-6 pb-6 rounded-lg shadow-lg shadow-foreground/15">
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
          
          {/* Temporarily hidden - will be restored later
          <NextWeekSection viewMode={viewMode} />
          */}

          <ContestSection
            title="THIS WEEK"
            subtitle="25-31 august 2025"
            description="Choose the winner of the week."
            isActive={true}
            noWrapTitle
            viewMode={viewMode}
          />

          <ContestSection
            title="1 WEEK AGO"
            titleSuffix="(Closed)"
            subtitle="18-24 August 2025"
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
          />

          <ContestSection
            title="2 WEEKS AGO"
            titleSuffix="(Closed)"
            subtitle="11-17 August 2025"
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
          />

          <ContestSection
            title="3 WEEKS AGO"
            titleSuffix="(Closed)"
            subtitle="4-10 August 2025"
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
          />

          <section className="max-w-6xl mx-auto px-6 mb-8">
            <AiChat />
          </section>
        </>
      )}

      {/* How it works content */}
      {activeSection === "How it works" && (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 text-foreground">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">🌟 How It Works</h2>
            <h3 className="text-lg text-muted-foreground mb-4">OBC (Online Beauty Contest)</h3>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Weekly Photo Contest */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">1. Weekly Photo Contest</h3>
              <EditableContent 
                content="Every week, we select the most beautiful girls from across the Philippines and post them on our site and social media."
                contentKey="weekly-contest"
                className="text-sm"
                isAdmin={isAdmin}
              />
            </div>
            
            {/* How to Join */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">2. How to Join</h3>
              <EditableContent 
                content={`To participate, send us:
📸 1 full-body photo (no filter, no makeup)
📸 1 close-up face photo (no makeup)

Submit your entry anytime! If not selected this week, you may be chosen for the next.`}
                contentKey="how-to-join"
                className="text-sm whitespace-pre-line"
                isAdmin={isAdmin}
              />
            </div>
            
            {/* Selection & Voting */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">3. Selection & Voting</h3>
              <EditableContent 
                content={`• Each Monday, we post new contestants.
• Our audience votes by liking photos ❤️
• Admins make the final decision to ensure fairness.`}
                contentKey="selection-voting"
                className="text-sm whitespace-pre-line"
                isAdmin={isAdmin}
              />
            </div>
            
            {/* Prizes */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">4. Prizes</h3>
              <EditableContent 
                content={`🏆 Weekly Winner: ₱5,000
👑 End-of-Year Grand Prize:
    1st Place – ₱200,000
    2nd Place – ₱100,000
    3rd Place – ₱50,000`}
                contentKey="prizes"
                className="text-sm whitespace-pre-line"
                isAdmin={isAdmin}
              />
            </div>
            
            {/* Rules */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">5. Rules</h3>
              <EditableContent 
                content={`• Girls only, aged 18–35
• No editing, filters, or makeup
• By sending photos, you agree we can use them for the contest and promotion`}
                contentKey="rules"
                className="text-sm whitespace-pre-line"
                isAdmin={isAdmin}
              />
            </div>
            
            {/* Questions */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">Questions?</h3>
              <EditableContent 
                content="Just message us anytime 💬"
                contentKey="questions"
                className="text-sm"
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
