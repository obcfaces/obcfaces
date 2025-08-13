import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <ContestHeader />
      
      <ContestSection
        title="THIS WEEK"
        subtitle="25-31 august 2025"
        description="Choose the winner of the week."
        isActive={true}
        noWrapTitle
      />
      
      <ContestSection
        title="1 WEEK AGO"
        titleSuffix="(Closed)"
        subtitle="18-24 August 2025"
        centerSubtitle
        showWinner={true}
      />
    </div>
  );
};

export default Index;
