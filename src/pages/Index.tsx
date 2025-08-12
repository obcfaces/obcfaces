import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";
import AuthNav from "@/components/auth-nav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="container mx-auto flex justify-between items-center gap-2 px-4 py-2">
        <div className="flex items-center gap-2">
          <Link to="/" className="inline-flex items-center font-semibold text-foreground hover:text-primary transition-colors" aria-label="На главную">
            Bryre
          </Link>
          <Button variant="ghost" size="icon" aria-label="Поиск">
            <Search className="h-5 w-5" />
          </Button>
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
