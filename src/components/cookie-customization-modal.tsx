import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CookiePreferences } from '@/hooks/useCookieConsent';
import { Shield, BarChart, Target, User } from 'lucide-react';

interface CookieCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: CookiePreferences;
  onSave: (preferences: CookiePreferences) => void;
}

export const CookieCustomizationModal = ({
  isOpen,
  onClose,
  currentPreferences,
  onSave,
}: CookieCustomizationModalProps) => {
  const [preferences, setPreferences] = useState<CookiePreferences>(currentPreferences);

  const handleSave = () => {
    onSave(preferences);
    onClose();
  };

  const togglePreference = (category: keyof CookiePreferences) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const cookieCategories = [
    {
      key: 'necessary' as const,
      title: 'Strictly Necessary',
      description: 'Essential for the website to function properly. These cannot be disabled.',
      icon: Shield,
      required: true,
      examples: 'Login sessions, security, basic site navigation',
    },
    {
      key: 'analytics' as const,
      title: 'Analytics',
      description: 'Help us understand how visitors interact with our website.',
      icon: BarChart,
      required: false,
      examples: 'Google Analytics, page views, user behavior tracking',
    },
    {
      key: 'marketing' as const,
      title: 'Marketing',
      description: 'Used to deliver relevant advertisements and measure campaign effectiveness.',
      icon: Target,
      required: false,
      examples: 'Meta Pixel, advertising networks, conversion tracking',
    },
    {
      key: 'personalization' as const,
      title: 'Personalization',
      description: 'Remember your preferences and provide customized experiences.',
      icon: User,
      required: false,
      examples: 'Language settings, theme preferences, layout choices',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Cookie Preferences</DialogTitle>
          <DialogDescription>
            Choose which types of cookies you're comfortable with. You can change these settings at any time.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {cookieCategories.map((category) => {
            const IconComponent = category.icon;
            const isEnabled = preferences[category.key];
            
            return (
              <Card key={category.key} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{category.title}</CardTitle>
                        {category.required && (
                          <span className="text-xs text-muted-foreground font-medium">Required</span>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => togglePreference(category.key)}
                      disabled={category.required}
                    />
                  </div>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">
                    <strong>Examples:</strong> {category.examples}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="flex justify-between gap-3 pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p>You can change these preferences at any time by visiting our Cookie Policy page.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Preferences
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};