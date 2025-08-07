import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

export function ContestHeader() {
  return (
    <div className="bg-contest-light-bg border-b border-contest-border">
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
        
        {/* Navigation sections below button */}
        <nav className="flex items-center gap-6 text-sm mt-4">
          <a href="#" className="text-contest-blue hover:underline">Mash</a>
          <a href="#" className="text-contest-blue hover:underline font-medium">Current Votes</a>
          <a href="#" className="text-muted-foreground hover:text-contest-blue">Winners</a>
          <a href="#" className="text-muted-foreground hover:text-contest-blue">How it works</a>
        </nav>
        
        <div className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium">Global Online Beauty & Model Contest</span>
          <br />
          Natural. Honest. Voted by People...
          <span className="ml-8">Upload your photos and try to win!</span>
        </div>
      </div>
    </div>
  );
}