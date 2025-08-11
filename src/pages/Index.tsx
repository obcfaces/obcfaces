import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LogIn, UserPlus } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="container mx-auto flex justify-end items-center gap-2 px-4 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/auth?mode=login">
              <Button variant="ghost" size="icon" aria-label="Войти">
                <LogIn className="size-5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>Войти</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/auth?mode=signup">
              <Button variant="ghost" size="icon" aria-label="Регистрация">
                <UserPlus className="size-5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>Регистрация</TooltipContent>
        </Tooltip>
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
