import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export const AgeVerification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const ageVerified = localStorage.getItem('age-verified');
    if (!ageVerified) {
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('age-verified', 'true');
    setIsOpen(false);
  };

  const handleReject = () => {
    // Redirect to a safe page or show a message
    window.location.href = 'https://www.google.com';
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md"  onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            {t("Age Verification Required")}
          </DialogTitle>
          <DialogDescription className="text-center mt-2">
            {t("You must be 18 years or older to access this website. This site contains content intended for adults only.")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-3">
          <Button onClick={handleConfirm} className="w-full" size="lg">
            {t("I am 18 or older")}
          </Button>
          <Button onClick={handleReject} variant="outline" className="w-full" size="lg">
            {t("I am under 18")}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          {t("By confirming your age, you agree that you are legally allowed to view adult content in your jurisdiction.")}
        </p>
      </DialogContent>
    </Dialog>
  );
};