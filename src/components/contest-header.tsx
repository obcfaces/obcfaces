import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Facebook } from "lucide-react";
import { AuthProtectedModal } from "@/components/auth-protected-modal";

interface ContestHeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function ContestHeader({ activeSection, onSectionChange }: ContestHeaderProps) {
  const navItems = [
    { name: "Contest", href: "#" },
    { name: "How it works", href: "#" }
  ];

  return (
    <div className="bg-contest-light-bg">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Title and button in one line */}
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-bold text-contest-text">OBC faces</h1>
          <AuthProtectedModal>
            <Button 
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 whitespace-nowrap"
            >
              🏆 Join & Win 5,000 PHP
            </Button>
          </AuthProtectedModal>
        </div>
        
        {/* Contest info points - always visible */}
        <div className="mt-6 space-y-1 text-sm text-contest-text">
          <div className="flex items-center gap-2">
            <span>🌐</span>
            <span>All online — no need to travel</span>
          </div>
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
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            <a 
              href="https://www.facebook.com/share/14N76M6vuPC/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Follow us on Facebook
            </a>
          </div>
        </div>
        
        {/* Navigation sections below description */}
        <nav className="flex items-center gap-6 text-sm -mb-6 mt-8">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => onSectionChange(item.name)}
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