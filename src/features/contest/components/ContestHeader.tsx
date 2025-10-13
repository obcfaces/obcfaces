import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Facebook, Instagram, Globe, AlignJustify, Grid2X2 } from "lucide-react";
import { AuthProtectedModal } from "@/components/auth-protected-modal";
import { Separator } from "@/components/ui/separator";
import LocaleCountryFilter from "@/components/locale-country-filter";
import { useTranslation } from "@/hooks/useTranslation";

export type ViewMode = "compact" | "full";

interface ContestHeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function ContestHeader({ activeSection, onSectionChange, viewMode = "compact", onViewModeChange }: ContestHeaderProps) {
  const { t } = useTranslation();
  
  const navItems = [
    { key: "Contest", label: t("Contest"), href: "#" },
    { key: "How it works", label: t("How it works"), href: "#" }
  ];

  return (
    <div className="bg-contest-light-bg">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* First line: Title "of" and Country Selector */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-contest-text whitespace-nowrap">OBC faces</h1>
          <span className="text-xl sm:text-2xl font-bold text-contest-text whitespace-nowrap">{t("of")}</span>
          <LocaleCountryFilter />
        </div>
        
        {/* Second line: Join button */}
        <div className="mt-4 w-full">
          <AuthProtectedModal>
            <Button 
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 whitespace-nowrap"
            >
              🏆 {t("Join & Win 5,000 PHP")}
            </Button>
          </AuthProtectedModal>
        </div>
        
        {/* Contest info points - always visible */}
        <div className="mt-6 space-y-1 text-sm text-contest-text">
          <div className="flex items-center gap-2">
            <span>🌐</span>
            <span>{t("All online — no need to travel")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌍</span>
            <span>{t("Anyone can join — open to all!")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📸</span>
            <span>{t("Free entry with just 2 photos")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⭐</span>
            <span>{t("Natural. Honest. Voted by People.")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏆</span>
            <span>{t("Weekly winner gets 5,000 PHP")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💰</span>
            <span>{t("Annual winner takes 100,000 PHP")}</span>
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
                {t("Follow us on Facebook")}
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
                {t("Follow us on Instagram")}
              </a>
            </div>
          </div>
        </div>
        
        {/* Navigation sections below description */}
        <nav className="flex items-center justify-between gap-6 text-sm -mb-6 mt-8">
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onSectionChange(item.key)}
                className={`py-0 transition-colors ${
                  activeSection === item.key
                    ? "text-contest-blue font-medium"
                    : "text-muted-foreground hover:text-contest-blue"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          
          {/* View mode toggles */}
          {onViewModeChange && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange("compact")}
                aria-pressed={viewMode === "compact"}
                aria-label="List view"
                className="p-1 rounded-md hover:bg-accent transition-colors"
              >
                <AlignJustify 
                  size={28} 
                  strokeWidth={1}
                  className={viewMode === "compact" ? "text-primary" : "text-muted-foreground"}
                />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("full")}
                aria-pressed={viewMode === "full"}
                aria-label="Grid view"
                className="p-1 rounded-md hover:bg-accent transition-colors"
              >
                <Grid2X2 
                  size={28} 
                  strokeWidth={1}
                  className={viewMode === "full" ? "text-primary" : "text-muted-foreground"}
                />
              </button>
            </div>
          )}
        </nav>
      </div>
      
      {/* Border line with active section underline */}
      <div className="relative border-b border-contest-border/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-6 text-sm">
            {navItems.map((item) => (
              <div
                key={item.key}
                className="relative py-0"
              >
                <span className="invisible">{item.label}</span>
                {activeSection === item.key && (
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