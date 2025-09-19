import { useState, useEffect } from "react";

import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";
import { NextWeekSection } from "@/components/next-week-section";
import ContestFilters from "@/components/contest-filters";

import { EditableContent } from "@/components/editable-content";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/components/contest-filters";

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
          
          <section className="max-w-6xl mx-auto pt-2 mb-1 sm:mb-3 mt-2 bg-background rounded-lg shadow-sm shadow-foreground/10">
            <ContestSection
              title="THIS WEEK"
              subtitle={getWeekRange(0)}
              description="Choose the winner."
              isActive={true}
              noWrapTitle
              viewMode={viewMode}
            />
          </section>


          <ContestSection
            title="1 WEEK AGO"
            titleSuffix="(Closed)"
            subtitle={getWeekRange(-1)}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
          />

          <ContestSection
            title="2 WEEKS AGO"
            titleSuffix="(Closed)"
            subtitle={getWeekRange(-2)}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
          />

          <ContestSection
            title="3 WEEKS AGO"
            titleSuffix="(Closed)"
            subtitle={getWeekRange(-3)}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
          />

        </>
      )}

      {/* How it works content */}
      {activeSection === "How it works" && (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 text-foreground">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-6xl">🌟</span>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                How It Works
              </h1>
              <span className="text-6xl">🌟</span>
            </div>
            <p className="text-lg text-muted-foreground font-medium">(international — user-facing, legal-safe)</p>
            <div className="mt-6 p-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
              <p className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                Join OBC — the international, fully online beauty contest.
              </p>
            </div>
          </div>
          
          <div className="space-y-8">
            {/* 1. Enter Anytime */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full text-2xl font-bold">1</div>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">📸 Enter Anytime</h3>
              </div>
              <EditableContent 
                content={`Upload two photos:
• 1 full-body photo (natural look — no filters, no heavy editing)
• 1 close-up face photo (no makeup)
By submitting, you confirm you are 18 years or older, you own the photos (or have permission), and you accept our [Terms] and [Privacy Policy].`}
                contentKey="enter-anytime"
                className="text-base whitespace-pre-line text-green-800 dark:text-green-200"
                isAdmin={isAdmin}
              />
            </div>

            {/* 2. Selection & Posting */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full text-2xl font-bold">2</div>
                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">🔍 Selection & Posting</h3>
              </div>
              <EditableContent 
                content="New contestants are posted each week. We review every entry for compliance with our rules; submissions may be rejected or removed if they violate our policies (see Rules below)."
                contentKey="selection-posting"
                className="text-base text-blue-800 dark:text-blue-200"
                isAdmin={isAdmin}
              />
            </div>

            {/* 3. Global Voting */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-500 text-white rounded-full text-2xl font-bold">3</div>
                <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">⭐ Global Voting</h3>
              </div>
              <EditableContent 
                content="Fans worldwide vote using star ratings. Weekly winners are chosen by highest rating; ties are resolved by likes or other pre-published tiebreakers. We monitor votes for fraud and reserve the right to adjust or void votes if manipulation is detected."
                contentKey="global-voting"
                className="text-base text-purple-800 dark:text-purple-200"
                isAdmin={isAdmin}
              />
            </div>

            {/* 4. Prizes & Verification */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500 text-white rounded-full text-2xl font-bold">4</div>
                <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-300">🏆 Prizes & Verification</h3>
              </div>
              <EditableContent 
                content="Prizes and payment methods are announced on the Platform. Winners are verified before payout and are responsible for any local taxes or fees. We may request identification to confirm eligibility."
                contentKey="prizes-verification"
                className="text-base text-orange-800 dark:text-orange-200"
                isAdmin={isAdmin}
              />
            </div>

            {/* 5. Rules & Safety */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-800 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full text-2xl font-bold">5</div>
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-300">🛡️ Rules & Safety</h3>
              </div>
              <EditableContent 
                content={`• Open to women aged 18–35 only.
• Prohibited: nudity, explicit/sexual content, sexualization of minors, hate speech, harassment, illegal content, AI-generated images of real people without consent, and any form of vote manipulation.
• By submitting, you grant OBC a limited, non-exclusive, worldwide license to use your photos for the contest and promotion (see full Terms). You retain ownership.
• If you see prohibited content, report it immediately via our report button or at support@obcfaces.com. We process reports and remove content that violates rules. Repeat infringers will be suspended.`}
                contentKey="rules-safety"
                className="text-base whitespace-pre-line text-red-800 dark:text-red-200"
                isAdmin={isAdmin}
              />
            </div>

            {/* Questions or disputes */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-lg text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-4xl">💬</span>
                <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Questions or disputes?</h3>
                <span className="text-4xl">💬</span>
              </div>
              <EditableContent 
                content="Contact support: support@obcfaces.com. For full details, see our [Terms] and [Privacy Policy] (links)."
                contentKey="questions-disputes"
                className="text-lg text-indigo-800 dark:text-indigo-200 font-medium"
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
