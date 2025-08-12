import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";
import AuthNav from "@/components/auth-nav";
import { Link } from "react-router-dom";
import GlobalSearch from "@/components/global-search";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="container mx-auto flex justify-between items-center gap-2 px-4 py-2">
        <div className="flex items-center gap-2">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors" aria-label="На главную">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">obc</span>
            <span>Bryre</span>
          </Link>
          <GlobalSearch />
        </div>
        <AuthNav />
      </nav>
      <ContestHeader />
      
      <ContestSection
        title="JULE 24 – 30 /// 2025"
        subtitle="Current vote right now!"
        description="Take a look at the three leaders who have already emerged in the current vote."
        isActive={true}
      />
      
      <ContestSection
        title="JULE 17 – 23 /// 2025"
        subtitle="Voting is over! We have a winner!"
        description="Take a look at the three leaders who have already emerged in the current vote."
        showWinner={true}
      />
    </div>
  );
};

export default Index;
