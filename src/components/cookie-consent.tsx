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
          <div className="flex items-center gap-4 p-4">
            <Cookie className="h-6 w-6 text-primary flex-shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <h3 className="font-semibold text-foreground">
                Cookies
              </h3>
              <span className="text-sm text-muted-foreground">
                We use cookies to improve your experience. Some are necessary, others (analytics/ads) need your consent. See our{" "}
                <a href="/cookie-policy" className="text-primary underline hover:no-underline">
                  Cookie Policy
                </a>.
              </span>
            </div>
            <div className="flex gap-3">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReject}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
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