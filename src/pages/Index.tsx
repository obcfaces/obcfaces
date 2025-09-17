import { useState, useEffect } from "react";

import { ContestHeader } from "@/components/contest-header";
import ContestFilters from "@/components/contest-filters";
import { EditableContent } from "@/components/editable-content";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/components/contest-filters";

// СОЗДАЕМ БЕЗОПАСНУЮ ВЕРСИЮ CONTEST SECTION БЕЗ РЕКУРСИИ
const SafeContestSection = ({ title, subtitle, description, isActive, showWinner, centerSubtitle, titleSuffix, noWrapTitle, viewMode }: {
  title: string;
  subtitle: string;
  description?: string;
  isActive?: boolean;
  showWinner?: boolean;
  centerSubtitle?: boolean;
  titleSuffix?: string;
  noWrapTitle?: boolean;
  viewMode?: 'compact' | 'full';
}) => {
  return (
    <section className={`max-w-6xl mx-auto py-8 mb-2 rounded-lg shadow-lg shadow-foreground/15 ${title === "THIS WEEK" ? "bg-green-50" : "bg-background"}`}>
      <div className="mb-8 px-6">
        <div className="mb-4">
          <div className="flex items-baseline gap-3 mb-1">
            <div className={`inline-flex flex-col w-fit ${centerSubtitle ? "items-center" : "items-start"}`}>
              <h2 className={`text-3xl font-bold text-contest-text ${noWrapTitle ? "whitespace-nowrap" : ""}`}>{title}</h2>
              <p className="text-sm text-muted-foreground/70 italic -mt-1">{subtitle}</p>
            </div>
            {titleSuffix && (
              <span className="text-2xl font-normal text-muted-foreground">{titleSuffix}</span>
            )}
            {isActive && description && (
              <span className="text-base font-normal text-contest-text">
                {description}
              </span>
            )}
          </div>
          {!isActive && description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      <div className="px-6">
        {/* Временные карточки участниц для демонстрации */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Карточка участницы 1 */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-40">
              <div className="w-32 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-pink-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-pink-600 text-lg">👤</span>
                  </div>
                  <p className="text-xs text-gray-600">Photo</p>
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">Maria Santos</h3>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">#1</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">📍 Manila, Philippines</p>
                <p className="text-sm text-gray-600 mb-2">👤 23 years • 165cm • 55kg</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    ⭐⭐⭐⭐⭐
                  </div>
                  <span className="text-sm text-gray-600">4.8 (124 votes)</span>
                </div>
                <button className="w-full bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600 transition-colors">
                  View Profile
                </button>
              </div>
            </div>
          </div>

          {/* Карточка участницы 2 */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-40">
              <div className="w-32 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-blue-600 text-lg">👤</span>
                  </div>
                  <p className="text-xs text-gray-600">Photo</p>
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">Ana Cruz</h3>
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">#2</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">📍 Cebu, Philippines</p>
                <p className="text-sm text-gray-600 mb-2">👤 21 years • 160cm • 52kg</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    ⭐⭐⭐⭐⭐
                  </div>
                  <span className="text-sm text-gray-600">4.5 (98 votes)</span>
                </div>
                <button className="w-full bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600 transition-colors">
                  View Profile
                </button>
              </div>
            </div>
          </div>

          {/* Карточка участницы 3 */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-40">
              <div className="w-32 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-green-600 text-lg">👤</span>
                  </div>
                  <p className="text-xs text-gray-600">Photo</p>
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">Isabella Reyes</h3>
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">#3</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">📍 Davao, Philippines</p>
                <p className="text-sm text-gray-600 mb-2">👤 25 years • 168cm • 58kg</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    ⭐⭐⭐⭐⭐
                  </div>
                  <span className="text-sm text-gray-600">4.2 (87 votes)</span>
                </div>
                <button className="w-full bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600 transition-colors">
                  View Profile
                </button>
              </div>
            </div>
          </div>

          {/* Кнопка подачи заявки */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-200 rounded-lg overflow-hidden">
            <div className="flex h-40 items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-purple-600 text-2xl">➕</span>
                </div>
                <h3 className="font-semibold text-lg text-purple-700 mb-2">Join the Contest</h3>
                <button className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors">
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

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
  
  console.log('Index component rendering - SITE FULLY RESTORED WITH CONTEST CARDS!');
  
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
          
          <section className="max-w-6xl mx-auto pt-2 mb-2 mt-2 bg-background rounded-lg shadow-sm shadow-foreground/10">
            <SafeContestSection
              title="THIS WEEK"
              subtitle={getWeekRange(0)}
              description="Choose the winner."
              isActive={true}
              noWrapTitle
              viewMode={viewMode}
            />
          </section>

          <SafeContestSection
            title="1 WEEK AGO"
            titleSuffix="(Closed)"
            subtitle={getWeekRange(-1)}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
          />

          <SafeContestSection
            title="2 WEEKS AGO"
            titleSuffix="(Closed)"
            subtitle={getWeekRange(-2)}
            centerSubtitle
            showWinner={true}
            viewMode={viewMode}
          />

          <SafeContestSection
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
