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

  const handleCustomize = () => {
    localStorage.setItem('cookie-consent', 'customized');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
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
  );
};