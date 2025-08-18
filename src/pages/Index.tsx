import { useState, useEffect } from "react";

import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";
import { NextWeekSection } from "@/components/next-week-section";
import ContestFilters from "@/components/contest-filters";
import AiChat from "@/components/ai-chat";
import { EditableContent } from "@/components/editable-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, Facebook, Instagram } from "lucide-react";
import type { Category } from "@/components/contest-filters";

const Index = () => {
  const [country, setCountry] = useState<string>("PH");
  const [gender, setGender] = useState<'male' | 'female'>("female");
  const [viewMode, setViewMode] = useState<'compact' | 'full'>("compact");
  const [activeSection, setActiveSection] = useState("Contest");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedContactMethod, setSelectedContactMethod] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    contact: "",
    message: ""
  });

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
          
          {/* Contact for Prize Transfer Section */}
          <div className="mt-8 bg-white/50 p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-center">How to contact us for prize transfer</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Button
                variant={selectedContactMethod === "phone" ? "default" : "outline"}
                onClick={() => setSelectedContactMethod("phone")}
                className="flex items-center gap-2"
              >
                <Phone size={16} />
                Phone
              </Button>
              
              <Button
                variant={selectedContactMethod === "email" ? "default" : "outline"}
                onClick={() => setSelectedContactMethod("email")}
                className="flex items-center gap-2"
              >
                <Mail size={16} />
                Email
              </Button>
              
              <Button
                variant={selectedContactMethod === "facebook" ? "default" : "outline"}
                onClick={() => setSelectedContactMethod("facebook")}
                className="flex items-center gap-2"
              >
                <Facebook size={16} />
                Facebook
              </Button>
              
              <Button
                variant={selectedContactMethod === "instagram" ? "default" : "outline"}
                onClick={() => setSelectedContactMethod("instagram")}
                className="flex items-center gap-2"
              >
                <Instagram size={16} />
                Instagram
              </Button>
            </div>

            {selectedContactMethod && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Contact Form</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact">
                      {selectedContactMethod === "phone" && "Phone Number"}
                      {selectedContactMethod === "email" && "Email Address"}
                      {selectedContactMethod === "facebook" && "Facebook Profile/Username"}
                      {selectedContactMethod === "instagram" && "Instagram Username"}
                    </Label>
                    <Input
                      id="contact"
                      value={contactForm.contact}
                      onChange={(e) => setContactForm({...contactForm, contact: e.target.value})}
                      placeholder={
                        selectedContactMethod === "phone" ? "Enter your phone number" :
                        selectedContactMethod === "email" ? "Enter your email address" :
                        selectedContactMethod === "facebook" ? "Enter your Facebook profile" :
                        "Enter your Instagram username"
                      }
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      placeholder="Tell us about your prize transfer inquiry..."
                      rows={4}
                    />
                  </div>
                  
                  <Button className="w-full">
                    Submit Contact Request
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
