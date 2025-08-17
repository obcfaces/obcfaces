import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";
import { ContestParticipationModal } from "@/components/contest-participation-modal";

export function ContestHeader() {
  const [activeSection, setActiveSection] = useState("Contest");

  const navItems = [
    { name: "Contest", href: "#" },
    { name: "How it works", href: "#" }
  ];

  return (
    <div className="bg-contest-light-bg">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Title and button in one line */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-contest-text">OBC faces</h1>
          <ContestParticipationModal>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              🏆 Join & Win 5,000 PHP
            </Button>
          </ContestParticipationModal>
        </div>
        
        {/* Contest info points - only show on Contest tab */}
        {activeSection === "Contest" && (
          <div className="mt-3 space-y-1 text-sm text-contest-text">
            <div className="flex items-center gap-2">
              <span>🌍</span>
              <span>Anyone can join — open to all!</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📸</span>
              <span>Free entry with just 2 photos</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⭐</span>
              <span>Natural. Honest. Voted by People.</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🏆</span>
              <span>Weekly winner gets 5,000 PHP</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💰</span>
              <span>Annual winner takes 200,000 PHP</span>
            </div>
          </div>
        )}
        
        {/* How it works content */}
        {activeSection === "How it works" && (
          <div className="mt-6 space-y-6 text-contest-text">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">🌟 How It Works – OBC (Online Beauty Contest)</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Weekly Photo Contest */}
              <div className="bg-white/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">1. Weekly Photo Contest</h3>
                <p className="text-sm">Every week, we select the most beautiful girls from across the Philippines and post them on our site and social media.</p>
              </div>
              
              {/* How to Join */}
              <div className="bg-white/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">2. How to Join</h3>
                <p className="text-sm mb-2">To participate, send us:</p>
                <ul className="text-sm space-y-1">
                  <li>📸 1 full-body photo (no filter, no makeup)</li>
                  <li>📸 1 close-up face photo (no makeup)</li>
                </ul>
                <p className="text-sm mt-2">Submit your entry anytime! If not selected this week, you may be chosen for the next.</p>
              </div>
              
              {/* Selection & Voting */}
              <div className="bg-white/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">3. Selection & Voting</h3>
                <ul className="text-sm space-y-1">
                  <li>Each Monday, we post new contestants.</li>
                  <li>Our audience votes by liking photos ❤️</li>
                  <li>Admins make the final decision to ensure fairness.</li>
                </ul>
              </div>
              
              {/* Prizes */}
              <div className="bg-white/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">4. Prizes</h3>
                <ul className="text-sm space-y-1">
                  <li>🏆 <strong>Weekly Winner:</strong> ₱5,000</li>
                  <li>👑 <strong>End-of-Year Grand Prize:</strong></li>
                  <li className="ml-4">1st Place – ₱200,000</li>
                  <li className="ml-4">2nd Place – ₱100,000</li>
                  <li className="ml-4">3rd Place – ₱50,000</li>
                </ul>
              </div>
              
              {/* Rules */}
              <div className="bg-white/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">5. Rules</h3>
                <ul className="text-sm space-y-1">
                  <li>Girls only, aged 18–35</li>
                  <li>No editing, filters, or makeup</li>
                  <li>By sending photos, you agree we can use them for the contest and promotion</li>
                </ul>
              </div>
              
              {/* Questions */}
              <div className="bg-white/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Questions?</h3>
                <p className="text-sm">Just message us anytime 💬</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation sections below description */}
        <nav className="flex items-center gap-6 text-sm -mb-6 mt-8">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveSection(item.name)}
              className={`py-0 transition-colors ${
                activeSection === item.name
                  ? "text-contest-blue font-medium"
                  : "text-muted-foreground hover:text-contest-blue"
              }`}
            >
              {item.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Border line with active section underline */}
      <div className="relative border-b border-contest-border/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-6 text-sm">
            {navItems.map((item) => (
              <div
                key={item.name}
                className="relative py-0"
              >
                <span className="invisible">{item.name}</span>
                {activeSection === item.name && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-contest-blue"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}