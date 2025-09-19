import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useCookieConsent, CookiePreferences } from '@/hooks/useCookieConsent';
import { CookieCustomizationModal } from './cookie-customization-modal';
import { useToast } from '@/hooks/use-toast';
import { Settings, Shield, BarChart, Target, User, CheckCircle } from 'lucide-react';

export const CookiePreferencesManager = () => {
  const [showCustomization, setShowCustomization] = useState(false);
  const { toast } = useToast();
  const { 
    preferences, 
    hasConsent, 
    acceptAll, 
    rejectAll, 
    saveCustomPreferences,
    resetConsent 
  } = useCookieConsent();

  const handleSaveCustom = (customPreferences: CookiePreferences) => {
    saveCustomPreferences(customPreferences);
    toast({
      title: "Preferences updated",
      description: "Your cookie preferences have been saved successfully.",
    });
  };

  const handleAcceptAll = () => {
    acceptAll();
    toast({
      title: "All cookies accepted",
      description: "All cookie categories have been enabled.",
    });
  };

  const handleRejectAll = () => {
    rejectAll();
    toast({
      title: "Cookies minimized",
      description: "Only essential cookies are now enabled.",
    });
  };

  const handleReset = () => {
    resetConsent();
    toast({
      title: "Settings reset",
      description: "Cookie consent has been reset. You'll see the consent banner again.",
    });
  };

  const categoryIcons = {
    necessary: Shield,
    analytics: BarChart,
    marketing: Target,
    personalization: User,
  };

  const getCategoryLabel = (category: keyof CookiePreferences) => {
    const labels = {
      necessary: 'Strictly Necessary',
      analytics: 'Analytics',
      marketing: 'Marketing',
      personalization: 'Personalization',
    };
    return labels[category];
  };

  if (hasConsent === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cookie Preferences
          </CardTitle>
          <CardDescription>
            Loading your cookie preferences...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Cookie Preferences
          </CardTitle>
          <CardDescription>
            {hasConsent 
              ? "Update your cookie preferences at any time."
              : "You haven't set your cookie preferences yet."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasConsent && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Current Settings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(preferences).map(([category, enabled]) => {
                  const IconComponent = categoryIcons[category as keyof CookiePreferences];
                  return (
                    <div 
                      key={category}
                      className={`flex items-center gap-2 p-3 rounded-lg border ${
                        enabled ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                      }`}
                    >
                      <IconComponent className={`h-4 w-4 ${enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium">
                        {getCategoryLabel(category as keyof CookiePreferences)}
                      </span>
                      {enabled && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setShowCustomization(true)}
              variant="default"
            >
              {hasConsent ? 'Customize Settings' : 'Set Preferences'}
            </Button>
            <Button onClick={handleAcceptAll} variant="outline">
              Accept All
            </Button>
            <Button onClick={handleRejectAll} variant="outline">
              Essential Only
            </Button>
            {hasConsent && (
              <Button onClick={handleReset} variant="outline" size="sm">
                Reset All
              </Button>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
            <p className="font-medium mb-1">Note:</p>
            <p>
              Essential cookies are always enabled and cannot be disabled as they are required for the website to function properly.
              Changes to your preferences will take effect immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      <CookieCustomizationModal
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        currentPreferences={preferences}
        onSave={handleSaveCustom}
      />
    </>
  );
};