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
  const [category, setCategory] = useState<"" | Category>("");

  // Восстановление category из localStorage при загрузке
  useEffect(() => {
    const savedCategory = localStorage.getItem('contest-category-filter');
    if (savedCategory !== null) {
      setCategory(savedCategory as "" | Category);
    }
  }, []);

  // Сохранение category в localStorage при изменении
  const handleCategoryChange = (newCategory: "" | Category) => {
    setCategory(newCategory);
    localStorage.setItem('contest-category-filter', newCategory);
  };
  return (
    <div className="min-h-screen bg-background">
      <ContestHeader />
      
      <section className="max-w-6xl mx-auto px-6 sm:px-0 mt-4">
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
      </section>
      
      <ContestSection
        title="THIS WEEK"
        subtitle="25-31 august 2025"
        description="Choose the winner of the week."
        isActive={true}
        noWrapTitle
        viewMode={viewMode}
      />

      <div className="px-6 sm:px-0" aria-hidden>
        <hr className="my-8 sm:my-10 border-border" />
      </div>

      <NextWeekSection viewMode={viewMode} />

      <div className="px-6 sm:px-0" aria-hidden>
        <hr className="my-8 sm:my-10 border-border" />
      </div>

      <ContestSection
        title="1 WEEK AGO"
        titleSuffix="(Closed)"
        subtitle="18-24 August 2025"
        centerSubtitle
        showWinner={true}
      />

      <div className="px-6 sm:px-0" aria-hidden>
        <hr className="my-8 sm:my-10 border-border" />
      </div>

      <section className="max-w-6xl mx-auto px-6 sm:px-0 mb-8">
        <AiChat />
      </section>
    </div>
  );
};

export default Index;
