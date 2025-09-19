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
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 text-foreground">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">🌟 How It Works</h2>
            <p className="text-lg text-muted-foreground">(international — user-facing, legal-safe)</p>
            <p className="text-xl font-semibold mt-2">Join OBC — the international, fully online beauty contest.</p>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <EditableContent 
              content={`**1. Enter Anytime**
Upload two photos:
• 1 full-body photo (natural look — no filters, no heavy editing)
• 1 close-up face photo (no makeup)
By submitting, you confirm you are 18 years or older, you own the photos (or have permission), and you accept our [Terms] and [Privacy Policy].

**2. Selection & Posting**
New contestants are posted each week. We review every entry for compliance with our rules; submissions may be rejected or removed if they violate our policies (see Rules below).

**3. Global Voting**
Fans worldwide vote using star ratings. Weekly winners are chosen by highest rating; ties are resolved by likes or other pre-published tiebreakers. We monitor votes for fraud and reserve the right to adjust or void votes if manipulation is detected.

**4. Prizes & Verification**
Prizes and payment methods are announced on the Platform. Winners are verified before payout and are responsible for any local taxes or fees. We may request identification to confirm eligibility.

**5. Rules & Safety**
• Open to women aged 18–35 only.
• Prohibited: nudity, explicit/sexual content, sexualization of minors, hate speech, harassment, illegal content, AI-generated images of real people without consent, and any form of vote manipulation.
• By submitting, you grant OBC a limited, non-exclusive, worldwide license to use your photos for the contest and promotion (see full Terms). You retain ownership.
• If you see prohibited content, report it immediately via our report button or at support@obcfaces.com. We process reports and remove content that violates rules. Repeat infringers will be suspended.

**Questions or disputes?**
Contact support: support@obcfaces.com. For full details, see our [Terms] and [Privacy Policy] (links).`}
              contentKey="how-it-works-comprehensive"
              className="text-sm whitespace-pre-line"
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
