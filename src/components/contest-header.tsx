import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Facebook, Instagram, Globe } from "lucide-react";
import { AuthProtectedModal } from "@/components/auth-protected-modal";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTEST_COUNTRIES } from "@/types/admin";
import { usePublicCountry } from "@/contexts/PublicCountryContext";

interface ContestHeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function ContestHeader({ activeSection, onSectionChange }: ContestHeaderProps) {
  const { countryCode, navigateToCountry, flag, countryName } = usePublicCountry();
  
  const navItems = [
    { name: "Contest", href: "#" },
    { name: "How it works", href: "#" }
  ];

  return (
    <div className="bg-contest-light-bg">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Title, Country Selector and button in one line */}
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-contest-text">OBC faces</h1>
            
            {/* Country Selector */}
            <Select value={countryCode} onValueChange={navigateToCountry}>
              <SelectTrigger className="w-[200px] bg-background border-contest-border">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span>{flag}</span>
                    <span>{countryName}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CONTEST_COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
            <span>Annual winner takes 100,000 PHP</span>
          </div>
        </div>
        
        {/* Social media links section */}
        <div className="mt-4">
          <Separator className="mb-3" />
          <div className="space-y-1 text-sm text-contest-text">
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
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              <a 
                href="https://www.instagram.com/obcfacesph?igsh=NTEyeGpkaW81anR5&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 hover:text-pink-800 hover:underline transition-colors"
              >
                Follow us on Instagram
              </a>
            </div>
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