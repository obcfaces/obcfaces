import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { ContestHeader } from "@/components/contest-header";
import { ContestWeeksRenderer } from "@/components/ContestWeeksRenderer";
import { PublicCountryProvider, usePublicCountry } from "@/contexts/PublicCountryContext";
import { useAdminStatus } from "@/hooks/useAdminStatus";

type ViewMode = 'compact' | 'full';

const ContestContent = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [activeSection, setActiveSection] = useState("Contest");
  const { countryCode, timezone } = usePublicCountry();
  
  const { loading } = useAdminStatus();

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <SEOHead
        title="Contest – Weekly Beauty Competition Entries"
        description="Browse weekly beauty contest entries and finalists. Vote for your favorite contestants and see past winners."
        canonicalPath="/contest"
      />

      <main className="min-h-screen bg-background">
        <ContestHeader activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <div className="space-y-8">
          <ContestWeeksRenderer 
            viewMode={viewMode}
            countryCode={countryCode}
            timezone={timezone}
            enableVirtualization={true}
          />
        </div>
      </main>
    </>
  );
};

const Contest = () => {
  return (
    <PublicCountryProvider>
      <ContestContent />
    </PublicCountryProvider>
  );
};

export default Contest;
