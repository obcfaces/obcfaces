import { useState, useEffect } from "react";

import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";
import { NextWeekSection } from "@/components/next-week-section";
import ContestFilters from "@/components/contest-filters";

import { EditableContent } from "@/components/editable-content";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
          
          <NextWeekSection viewMode={viewMode} />
          
          <section className="max-w-6xl mx-auto pt-2 mb-1 sm:mb-3 mt-2 bg-background rounded-lg shadow-sm shadow-foreground/10">
          <ContestSection
            title="THIS WEEK"
            subtitle={getWeekRange(0)}
            description="Choose the winner."
            isActive={true}
            noWrapTitle
            viewMode={viewMode}
            weekOffset={0}
          />
          </section>


          <ContestSection
            title="1 WEEK AGO"
            titleSuffix="(Closed)"
            subtitle={getWeekRange(-1)}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
            weekOffset={1}
          />

          <ContestSection
            title="2 WEEKS AGO"
            titleSuffix="(Closed)"
            subtitle={getWeekRange(-2)}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
            weekOffset={2}
          />

          <ContestSection
            title="3 WEEKS AGO"
            titleSuffix="(Closed)"
            subtitle={getWeekRange(-3)}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
            weekOffset={3}
          />

        </>
      )}

      {/* How it works content */}
      {activeSection === "How it works" && (
        <div className="max-w-6xl mx-auto px-0 sm:px-6 py-6 text-foreground">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent mb-3">
              How It Works
            </h1>
            <p className="text-lg text-muted-foreground font-medium mb-4">(international — user-facing, legal-safe)</p>
            <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <p className="text-xl md:text-2xl font-bold text-center bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                Join OBC — the international, fully online beauty contest.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Steps 1-5 in grid layout */}
            <div className="grid gap-4 md:gap-6">
              {/* 1. Enter Anytime */}
              <div className="bg-background p-4 sm:p-6 rounded-none sm:rounded-xl border-0 sm:border border-border shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full text-lg font-bold">1</div>
                  <h3 className="text-lg font-bold text-foreground">📸 Enter Anytime</h3>
                </div>
                <div className="text-sm whitespace-pre-line text-foreground text-justify ml-13">
                  Upload two photos:
                  • 1 full-body photo (natural look — no filters, no heavy editing)
                  • 1 close-up face photo (no makeup)
                  By submitting, you confirm you are 18 years or older, you own the photos (or have permission), and you accept our{" "}
                  <a href="/terms" className="text-primary hover:underline font-semibold">Terms</a>
                  {" and "}
                  <a href="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</a>.
                </div>
              </div>

              {/* 2. Selection & Posting */}
              <div className="bg-background p-4 sm:p-6 rounded-none sm:rounded-xl border-0 sm:border border-border shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full text-lg font-bold">2</div>
                  <h3 className="text-lg font-bold text-foreground">🔍 Selection & Posting</h3>
                </div>
                <div className="ml-13">
                  <EditableContent 
                    content="New contestants are posted each week. We review every entry for compliance with our rules; submissions may be rejected or removed if they violate our policies (see Rules below)."
                    contentKey="selection-posting"
                    className="text-sm text-foreground text-justify"
                    isAdmin={isAdmin}
                  />
                </div>
              </div>

              {/* 3. Global Voting */}
              <div className="bg-background p-4 sm:p-6 rounded-none sm:rounded-xl border-0 sm:border border-border shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full text-lg font-bold">3</div>
                  <h3 className="text-lg font-bold text-foreground">⭐ Global Voting</h3>
                </div>
                <div className="ml-13">
                  <EditableContent 
                    content="Fans worldwide vote using star ratings. Weekly winners are chosen by highest rating; ties are resolved by likes or other pre-published tiebreakers. We monitor votes for fraud and reserve the right to adjust or void votes if manipulation is detected."
                    contentKey="global-voting"
                    className="text-sm text-foreground text-justify"
                    isAdmin={isAdmin}
                  />
                </div>
              </div>

              {/* 4. Prizes & Verification */}
              <div className="bg-background p-4 sm:p-6 rounded-none sm:rounded-xl border-0 sm:border border-border shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full text-lg font-bold">4</div>
                  <h3 className="text-lg font-bold text-foreground">🏆 Prizes & Verification</h3>
                </div>
                <div className="ml-13">
                  <EditableContent 
                    content="Prizes and payment methods are announced on the Platform. Winners are verified before payout and are responsible for any local taxes or fees. We may request identification to confirm eligibility."
                    contentKey="prizes-verification"
                    className="text-sm text-foreground text-justify"
                    isAdmin={isAdmin}
                  />
                </div>
              </div>

              {/* 5. Rules & Safety */}
              <div className="bg-background p-4 sm:p-6 rounded-none sm:rounded-xl border-0 sm:border border-border shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full text-lg font-bold">5</div>
                  <h3 className="text-lg font-bold text-foreground">🛡️ Rules & Safety</h3>
                </div>
                <div className="ml-13">
                  <EditableContent 
                    content={`• Open to women aged 18–35 only.
• Prohibited: nudity, explicit/sexual content, sexualization of minors, hate speech, harassment, illegal content, AI-generated images of real people without consent, and any form of vote manipulation.
• By submitting, you grant OBC a limited, non-exclusive, worldwide license to use your photos for the contest and promotion (see full Terms). You retain ownership.
• If you see prohibited content, report it immediately via our report button or at support@obcfaces.com. We process reports and remove content that violates rules. Repeat infringers will be suspended.`}
                    contentKey="rules-safety"
                    className="text-sm whitespace-pre-line text-foreground text-justify"
                    isAdmin={isAdmin}
                  />
                </div>
              </div>
            </div>

            {/* Questions or disputes */}
            <div className="bg-background p-4 sm:p-6 rounded-none sm:rounded-xl border-0 sm:border border-border shadow-md text-center mt-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl">💬</span>
                <h3 className="text-lg font-bold text-foreground">Questions or disputes?</h3>
              </div>
              <div className="text-sm text-foreground text-justify">
                <EditableContent 
                  content="Contact support: support@obcfaces.com. For full details, see our"
                  contentKey="questions-disputes-intro"
                  className="text-sm text-foreground inline"
                  isAdmin={isAdmin}
                />
                {" "}
                <a href="/terms" className="text-primary hover:underline font-semibold">Terms</a>
                {" and "}
                <a href="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</a>.
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-background p-4 sm:p-6 rounded-none sm:rounded-xl border-0 sm:border border-border shadow-md mt-6">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-lg font-bold text-foreground">❓ Frequently Asked Questions (FAQ)</h3>
              </div>
              
              <div className="max-w-4xl mx-auto">
                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="item-1" className="bg-muted/30 rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="text-sm font-bold">How much does participation cost?</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <EditableContent 
                        content="Free of charge."
                        contentKey="faq-cost-answer"
                        className="text-sm"
                        isAdmin={isAdmin}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="bg-muted/30 rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="text-sm font-bold">How is the winner determined?</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <EditableContent 
                        content="By number of votes (anti-fraud protection enabled). Only registered users can vote. One user - one vote per candidate."
                        contentKey="faq-winner-answer"
                        className="text-sm"
                        isAdmin={isAdmin}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" className="bg-muted/30 rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="text-sm font-bold">How and when are prizes awarded?</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <EditableContent 
                        content="Weekly through quick payment systems/GCash/bank transfer, annual — offline/online ceremony."
                        contentKey="faq-prizes-answer"
                        className="text-sm"
                        isAdmin={isAdmin}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="bg-muted/30 rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="text-sm font-bold">Can I participate again?</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <EditableContent 
                        content="After one year from participation."
                        contentKey="faq-repeat-answer"
                        className="text-sm"
                        isAdmin={isAdmin}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5" className="bg-muted/30 rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="text-sm font-bold">What's the minimum age to participate?</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <EditableContent 
                        content="18 years old."
                        contentKey="faq-age-answer"
                        className="text-sm"
                        isAdmin={isAdmin}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
