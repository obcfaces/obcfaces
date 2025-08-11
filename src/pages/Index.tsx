import { ContestHeader } from "@/components/contest-header";
import { ContestSection } from "@/components/contest-section";
import LoginModalTrigger from "@/components/login-modal";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="container mx-auto flex justify-end items-center gap-2 px-4 py-2">
        <LoginModalTrigger />
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
