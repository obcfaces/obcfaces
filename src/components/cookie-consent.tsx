import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="mx-auto max-w-4xl border border-border bg-background/95 backdrop-blur-sm shadow-lg">
        <div className="flex items-start gap-4 p-6">
          <Cookie className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">
              {t("We use cookies")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleAccept} size="sm">
                {t("Accept All")}
              </Button>
              <Button onClick={handleReject} variant="outline" size="sm">
                {t("Reject All")}
              </Button>
            </div>
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
  );
};