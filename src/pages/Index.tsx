import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { ContestHeader, ContestWeeksRenderer, ContestFiltersComponent as ContestFilters } from "@/features/contest";
import { EditableContent } from "@/components/editable-content";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Category } from "@/features/contest/components/ContestFilters";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAdminStatus();
  const { t } = useTranslation();
  const [testTranslation, setTestTranslation] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Initialize state from URL params or defaults
  const [country, setCountry] = useState<string>(() => searchParams.get("country") || "PH");
  const [gender, setGender] = useState<'male' | 'female'>(() => {
    const param = searchParams.get("gender");
    return (param === "male" || param === "female") ? param : "female";
  });
  const [viewMode, setViewMode] = useState<'compact' | 'full'>(() => {
    const param = searchParams.get("view");
    return (param === "full" || param === "compact") ? param : "compact";
  });
  const [activeSection, setActiveSection] = useState("Contest");
  const [category, setCategory] = useState<"" | Category>(() => {
    return (searchParams.get("category") as "" | Category) || "";
  });

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (country !== "PH") params.set("country", country);
    if (gender !== "female") params.set("gender", gender);
    if (viewMode !== "compact") params.set("view", viewMode);
    if (category) params.set("category", category);
    
    setSearchParams(params, { replace: true });
  }, [country, gender, viewMode, category, setSearchParams]);

  const handleCategoryChange = (newCategory: "" | Category) => {
    setCategory(newCategory);
  };

  // Test auto-translate function
  const handleTestTranslation = async () => {
    setIsTranslating(true);
    try {
      // Call auto-translate edge function
      const { data, error } = await supabase.functions.invoke('auto-translate');
      
      if (error) {
        toast.error(`Translation error: ${error.message}`);
        console.error('Auto-translate error:', error);
      } else {
        toast.success(`Translated ${data?.translated || 0} keys`);
        console.log('Auto-translate result:', data);
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to call auto-translate function');
    } finally {
      setIsTranslating(false);
    }
  };

  // Test translation key
  useEffect(() => {
    const translation = t('growth.test_key');
    setTestTranslation(translation);
    console.log('Test translation:', translation);
  }, [t]);
  
  console.log('Index component rendering, viewMode:', viewMode);
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="OBC – Online Beauty Contest | Vote for Your Favorite"
        description="Join the international online beauty contest. Vote for contestants, participate in weekly competitions, and win prizes. Open to women aged 18-35."
        canonicalPath="/"
      />
      
      <ContestHeader 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      {/* Content area that changes based on active section */}
      {activeSection === "Contest" && (
        <>
          {/* Test Auto-Translate Button (only for admins) */}
          {isAdmin && (
            <div className="max-w-6xl mx-auto px-6 pt-6">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-mono">Test Translation: {testTranslation}</p>
                <Button 
                  onClick={handleTestTranslation}
                  disabled={isTranslating}
                  size="sm"
                  variant="outline"
                >
                  {isTranslating ? 'Translating...' : 'Test Auto-Translate'}
                </Button>
              </div>
            </div>
          )}
          
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
          
          
          <ContestWeeksRenderer 
            viewMode={viewMode}
            countryCode="PH"
            timezone="Asia/Manila"
            enableVirtualization={true}
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
