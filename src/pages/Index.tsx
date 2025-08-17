import { useState, useEffect } from "react";

import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";
import { NextWeekSection } from "@/components/next-week-section";
import ContestFilters from "@/components/contest-filters";
import AiChat from "@/components/ai-chat";
import type { Category } from "@/components/contest-filters";

const Index = () => {
  const [country, setCountry] = useState<string>("PH");
  const [gender, setGender] = useState<'male' | 'female'>("female");
  const [viewMode, setViewMode] = useState<'compact' | 'full'>("compact");
  const [activeSection, setActiveSection] = useState("Contest");
  
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
          
          <NextWeekSection viewMode={viewMode} />

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
            <h2 className="text-2xl font-bold mb-4">🌟 How It Works – OBC (Online Beauty Contest)</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Weekly Photo Contest */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">1. Weekly Photo Contest</h3>
              <p className="text-sm">Every week, we select the most beautiful girls from across the Philippines and post them on our site and social media.</p>
            </div>
            
            {/* How to Join */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">2. How to Join</h3>
              <p className="text-sm mb-2">To participate, send us:</p>
              <ul className="text-sm space-y-1">
                <li>📸 1 full-body photo (no filter, no makeup)</li>
                <li>📸 1 close-up face photo (no makeup)</li>
              </ul>
              <p className="text-sm mt-2">Submit your entry anytime! If not selected this week, you may be chosen for the next.</p>
            </div>
            
            {/* Selection & Voting */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">3. Selection & Voting</h3>
              <ul className="text-sm space-y-1">
                <li>Each Monday, we post new contestants.</li>
                <li>Our audience votes by liking photos ❤️</li>
                <li>Admins make the final decision to ensure fairness.</li>
              </ul>
            </div>
            
            {/* Prizes */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">4. Prizes</h3>
              <ul className="text-sm space-y-1">
                <li>🏆 <strong>Weekly Winner:</strong> ₱5,000</li>
                <li>👑 <strong>End-of-Year Grand Prize:</strong></li>
                <li className="ml-4">1st Place – ₱200,000</li>
                <li className="ml-4">2nd Place – ₱100,000</li>
                <li className="ml-4">3rd Place – ₱50,000</li>
              </ul>
            </div>
            
            {/* Rules */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">5. Rules</h3>
              <ul className="text-sm space-y-1">
                <li>Girls only, aged 18–35</li>
                <li>No editing, filters, or makeup</li>
                <li>By sending photos, you agree we can use them for the contest and promotion</li>
              </ul>
            </div>
            
            {/* Questions */}
            <div className="bg-white/50 p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">Questions?</h3>
              <p className="text-sm">Just message us anytime 💬</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
