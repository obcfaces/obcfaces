import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TopBar from "@/components/top-bar";
import { ContestSection } from "@/components/contest-section";
import { NextWeekSection } from "@/components/next-week-section";
import ContestFilters from "@/components/contest-filters";

import listIcon from "@/assets/icons/sdisplay-list.png";
import listActiveIcon from "@/assets/icons/sdisplay-list-active.png";
import tableIcon from "@/assets/icons/sdisplay-table.png";
import tableActiveIcon from "@/assets/icons/sdisplay-table-active.png";

const Index = () => {
  console.log('[INDEX] Full site with mobile optimization');
  
  const [viewMode, setViewMode] = useState<'compact' | 'full'>('compact');
  const [country, setCountry] = useState<string>('PH');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [category, setCategory] = useState<'teen' | 'miss' | 'ms' | 'mrs' | ''>('miss');

  return (
    <>
      <Helmet>
        <title>OBC Faces of Philippines - Global Online Beauty Contest</title>
        <meta name="description" content="Global Online Beauty & Model Contest. Natural. Honest. Voted by People. Upload your photos and try to win!" />
        <link rel="canonical" href="/" />
        <meta property="og:title" content="OBC Faces of Philippines - Global Online Beauty Contest" />
        <meta property="og:description" content="Global Online Beauty & Model Contest. Natural. Honest. Voted by People. Upload your photos and try to win!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <TopBar />
        
        <main>
          <div className="container mx-auto px-0">
            <Tabs defaultValue="this-week" className="w-full">
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                  <TabsList className="grid w-fit grid-cols-2 bg-muted/30">
                    <TabsTrigger value="this-week" className="text-sm">THIS WEEK</TabsTrigger>
                    <TabsTrigger value="winners" className="text-sm">WINNERS</TabsTrigger>
                  </TabsList>
                  
                  {/* View Mode Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('full')}
                      aria-pressed={viewMode === 'full'}
                      aria-label="List view"
                      className="p-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <img
                        src={viewMode === 'full' ? listActiveIcon : listIcon}
                        alt="List view"
                        width={24}
                        height={24}
                        loading="lazy"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('compact')}
                      aria-pressed={viewMode === 'compact'}
                      aria-label="Grid view"
                      className="p-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <img
                        src={viewMode === 'compact' ? tableActiveIcon : tableIcon}
                        alt="Grid view"
                        width={24}
                        height={24}
                        loading="lazy"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <TabsContent value="this-week" className="mt-0">
                <ContestFilters
                  country={country}
                  onCountryChange={setCountry}
                  gender={gender}
                  onGenderChange={setGender}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  category={category}
                  onCategoryChange={setCategory}
                />
                <ContestSection
                  title="THIS WEEK"
                  subtitle="25 - 31 August 2025"
                  description="Help us choose the winner of the week."
                  isActive
                  viewMode={viewMode}
                />
                <NextWeekSection />
              </TabsContent>

              <TabsContent value="winners" className="mt-0">
                <ContestFilters
                  country={country}
                  onCountryChange={setCountry}
                  gender={gender}
                  onGenderChange={setGender}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  category={category}
                  onCategoryChange={setCategory}
                />
                <ContestSection
                  title="WINNER"
                  subtitle="18 - 24 August 2025"
                  description=""
                  showWinner
                  centerSubtitle
                  titleSuffix="18 - 24 August 2025"
                  noWrapTitle
                  viewMode={viewMode}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default Index;