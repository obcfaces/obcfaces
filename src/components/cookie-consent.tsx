import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { CookieCustomizationModal } from "./cookie-customization-modal";
import { useToast } from "@/hooks/use-toast";

export const CookieConsent = () => {
  const [showCustomization, setShowCustomization] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();
  const { 
    preferences, 
    hasConsent, 
    acceptAll, 
    rejectAll, 
    saveCustomPreferences 
  } = useCookieConsent();

  const handleAccept = () => {
    acceptAll();
    toast({
      title: "Cookie preferences saved",
      description: "All cookies have been accepted.",
    });
  };

  const handleReject = () => {
    rejectAll();
    toast({
      title: "Cookie preferences saved", 
      description: "Only necessary cookies will be used.",
    });
  };

  const handleCustomize = () => {
    setShowCustomization(true);
  };

  const handleSaveCustom = (customPreferences: typeof preferences) => {
    saveCustomPreferences(customPreferences);
    toast({
      title: "Cookie preferences saved",
      description: "Your custom cookie preferences have been applied.",
    });
  };

  // Don't show if user has already given consent
  if (hasConsent !== false) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-0">
        <Card className="w-full border-t border-border bg-background/95 backdrop-blur-sm shadow-lg rounded-none">
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-4">
              <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-foreground">Cookies</span>
                <span className="text-sm text-muted-foreground ml-2">
                  We use cookies to improve your experience. Some are necessary, others (analytics/ads) need your consent. See our{" "}
                  <a href="/cookie-policy" className="text-primary underline hover:no-underline">
                    Cookie Policy
                  </a>.
                </span>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button onClick={handleAccept} size="sm">
                Accept all
              </Button>
              <Button onClick={handleReject} variant="outline" size="sm">
                Reject all
              </Button>
              <Button onClick={handleCustomize} variant="outline" size="sm">
                Customize
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <CookieCustomizationModal
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        currentPreferences={preferences}
        onSave={handleSaveCustom}
      />
    </>
  );
};