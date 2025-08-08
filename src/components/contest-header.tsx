import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

export function ContestHeader() {
  const [activeSection, setActiveSection] = useState("Current Votes");

  const navItems = [
    { name: "Mash", href: "#" },
    { name: "Current Votes", href: "#" },
    { name: "Winners", href: "#" },
    { name: "How it works", href: "#" }
  ];

  return (
    <div className="bg-contest-light-bg">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Title in one line */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-contest-text">OBC faces of</h1>
          <Button variant="outline" size="sm" className="text-contest-blue border-contest-blue">
            Philippines ▼
          </Button>
        </div>
        
        {/* Load photo button below title */}
        <div className="mt-4">
          <Button className="bg-contest-blue hover:bg-blue-600 text-white px-6">
            <Camera className="w-4 h-4 mr-2" />
            Load your photo and win 5000 Php
          </Button>
        </div>
        
        {/* Description */}
        <div className="mt-4 text-sm text-muted-foreground">
          <span className="font-medium">Global Online Beauty & Model Contest</span>
          <br />
          Natural. Honest. Voted by People...
          <span className="ml-8">Upload your photos and try to win!</span>
        </div>
        
        {/* Navigation sections below description */}
        <nav className="flex items-center gap-6 text-sm mt-0">
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
      <div className="relative border-b border-contest-border">
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