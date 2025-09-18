import { ChevronDown, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage, languages } from "@/contexts/LanguageContext";

const LanguageSelector = () => {
  const { currentLanguage, setLanguage } = useLanguage();

  const handleLanguageChange = (language: any) => {
    setLanguage(language);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <Globe className="h-3 w-3 mr-1" />
          {currentLanguage.code.toUpperCase()}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 max-h-64 overflow-y-auto bg-background border"
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            className="flex items-center gap-2 cursor-pointer hover:bg-accent"
          >
            <span className="text-base">{language.flag}</span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;