import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export const LocaleFallback: React.FC = () => {
  const { locale } = useParams();
  const navigate = useNavigate();

  const handleSwitchLocale = () => {
    const savedLang = localStorage.getItem("ui_lang") || "en";
    const savedCc = localStorage.getItem("ui_cc") || "ph";
    navigate(`/${savedLang}-${savedCc}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 text-center space-y-6 p-8 rounded-lg border border-border">
        <Globe className="w-16 h-16 mx-auto text-muted-foreground" />
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Locale Not Found</h1>
          <p className="text-muted-foreground">
            The locale <code className="px-2 py-1 bg-muted rounded">{locale}</code> is not supported.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleSwitchLocale} className="w-full">
            Switch to Default Locale
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Supported locales: en-ph, ru-kz, es-mx, and more...
          </p>
        </div>
      </div>
    </div>
  );
};
