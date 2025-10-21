import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Cookie, 
  Shield, 
  Settings, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  BarChart3,
  Target,
  Globe,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentData {
  hasConsented: boolean;
  consentDate: string;
  preferences: CookiePreferences;
  version: string;
}

const COOKIE_CONSENT_KEY = 'techlearnorbit_cookie_consent';
const COOKIE_VERSION = '1.0.0';

const defaultPreferences: CookiePreferences = {
  necessary: true,  // Always required
  functional: false,
  analytics: false,
  marketing: false,
  preferences: false,
};

const cookieCategories = [
  {
    id: 'necessary' as keyof CookiePreferences,
    title: 'Strictly Necessary Cookies',
    description: 'These cookies are essential for the website to function properly. They cannot be disabled.',
    required: true,
    icon: Shield,
    examples: ['Authentication tokens', 'Session management', 'Security cookies', 'Load balancers'],
    retention: 'Session to 1 year',
    purposes: ['User authentication', 'Security', 'Basic functionality']
  },
  {
    id: 'functional' as keyof CookiePreferences,
    title: 'Functional Cookies',
    description: 'These cookies enable enhanced functionality and personalization, such as videos and live chat.',
    required: false,
    icon: Settings,
    examples: ['Video player preferences', 'Chat settings', 'Language preferences', 'UI customizations'],
    retention: '1 year',
    purposes: ['Personalized experience', 'Remember settings', 'Enhanced features']
  },
  {
    id: 'analytics' as keyof CookiePreferences,
    title: 'Analytics Cookies',
    description: 'These cookies help us understand how visitors interact with our website by collecting anonymous information.',
    required: false,
    icon: BarChart3,
    examples: ['Google Analytics', 'Page views', 'User behavior', 'Performance metrics'],
    retention: '2 years',
    purposes: ['Website improvement', 'Performance analysis', 'User experience optimization']
  },
  {
    id: 'marketing' as keyof CookiePreferences,
    title: 'Marketing Cookies',
    description: 'These cookies are used to deliver personalized advertisements and track campaign effectiveness.',
    required: false,
    icon: Target,
    examples: ['Ad targeting', 'Conversion tracking', 'Retargeting pixels', 'Social media integrations'],
    retention: '1 year',
    purposes: ['Personalized advertising', 'Marketing campaigns', 'Social media integration']
  },
  {
    id: 'preferences' as keyof CookiePreferences,
    title: 'Preference Cookies',
    description: 'These cookies remember your choices and settings to provide you with a more personalized experience.',
    required: false,
    icon: Eye,
    examples: ['Theme preferences', 'Dashboard layout', 'Notification settings', 'Content preferences'],
    retention: '1 year',
    purposes: ['Remember user choices', 'Personalized content', 'Custom settings']
  }
];

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkCookieConsent();
  }, []);

  const checkCookieConsent = () => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        setIsVisible(true);
        return;
      }

      const consentData: CookieConsentData = JSON.parse(stored);
      
      // Check if consent is from a different version (require new consent)
      if (consentData.version !== COOKIE_VERSION) {
        setIsVisible(true);
        return;
      }

      // Check if consent is older than 1 year (require new consent)
      const consentDate = new Date(consentData.consentDate);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (consentDate < oneYearAgo) {
        setIsVisible(true);
        return;
      }

      // Valid consent exists
      setPreferences(consentData.preferences);
      applyCookiePreferences(consentData.preferences);
    } catch (error) {
      console.error('Error checking cookie consent:', error);
      setIsVisible(true);
    }
  };

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Apply analytics preferences
    if (prefs.analytics) {
      enableAnalytics();
    } else {
      disableAnalytics();
    }

    // Apply marketing preferences
    if (prefs.marketing) {
      enableMarketing();
    } else {
      disableMarketing();
    }

    // Apply functional preferences
    if (prefs.functional) {
      enableFunctional();
    } else {
      disableFunctional();
    }

    // Apply preference preferences
    if (prefs.preferences) {
      enablePreferences();
    } else {
      disablePreferences();
    }

    console.log('🍪 Cookie preferences applied:', prefs);
  };

  const enableAnalytics = () => {
    // Enable Google Analytics or other analytics
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
    
    // Enable custom analytics
    (window as any).techlearnorbitAnalytics = true;
  };

  const disableAnalytics = () => {
    // Disable Google Analytics
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
    
    // Disable custom analytics
    (window as any).techlearnorbitAnalytics = false;
  };

  const enableMarketing = () => {
    // Enable marketing cookies
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'ad_storage': 'granted'
      });
    }
    
    (window as any).techlearnorbitMarketing = true;
  };

  const disableMarketing = () => {
    // Disable marketing cookies
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'ad_storage': 'denied'
      });
    }
    
    (window as any).techlearnorbitMarketing = false;
  };

  const enableFunctional = () => {
    (window as any).techlearnorbitFunctional = true;
  };

  const disableFunctional = () => {
    (window as any).techlearnorbitFunctional = false;
  };

  const enablePreferences = () => {
    (window as any).techlearnorbitPreferences = true;
  };

  const disablePreferences = () => {
    (window as any).techlearnorbitPreferences = false;
  };

  const saveConsent = (acceptedPreferences: CookiePreferences) => {
    setLoading(true);
    
    try {
      const consentData: CookieConsentData = {
        hasConsented: true,
        consentDate: new Date().toISOString(),
        preferences: acceptedPreferences,
        version: COOKIE_VERSION
      };

      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
      applyCookiePreferences(acceptedPreferences);
      setPreferences(acceptedPreferences);
      setIsVisible(false);
      setShowDetails(false);

      toast({
        title: "Cookie Preferences Saved",
        description: "Your cookie preferences have been successfully saved.",
      });

      // Analytics event for consent
      if (acceptedPreferences.analytics && (window as any).techlearnorbitAnalytics) {
        // Track consent given
        console.log('📊 Consent granted - Analytics enabled');
      }

    } catch (error) {
      console.error('Error saving cookie consent:', error);
      toast({
        title: "Error Saving Preferences",
        description: "Failed to save cookie preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptAllCookies = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(allAccepted);
  };

  const acceptNecessaryOnly = () => {
    saveConsent(defaultPreferences);
  };

  const acceptCustomPreferences = () => {
    saveConsent(preferences);
  };

  const handlePreferenceChange = (category: keyof CookiePreferences, value: boolean) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg" data-testid="cookie-consent-banner">
      <div className="max-w-7xl mx-auto p-6">
        {!showDetails ? (
          // Simple Banner View
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-amber-600 mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1" data-testid="text-cookie-banner-title">
                  We Use Cookies
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
                  You can customize your preferences or accept all cookies.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowDetails(true)}
                className="text-sm"
                data-testid="button-customize-cookies"
              >
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
              <Button
                variant="outline"
                onClick={acceptNecessaryOnly}
                disabled={loading}
                className="text-sm"
                data-testid="button-necessary-only"
              >
                Necessary Only
              </Button>
              <Button
                onClick={acceptAllCookies}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-sm"
                data-testid="button-accept-all"
              >
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          // Detailed Preferences View
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cookie className="h-6 w-6 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowDetails(false)}
                className="text-sm"
              >
                ← Back to Simple View
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can enable or disable different types of cookies below. Changes will take effect immediately.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {cookieCategories.map((category) => {
                const Icon = category.icon;
                const isEnabled = preferences[category.id];
                
                return (
                  <Card key={category.id} className={`transition-all ${isEnabled ? 'ring-2 ring-blue-200' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${category.required ? 'text-red-500' : 'text-blue-500'}`} />
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {category.title}
                              {category.required && (
                                <Badge variant="secondary" className="text-xs">Required</Badge>
                              )}
                            </CardTitle>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handlePreferenceChange(category.id, checked)}
                          disabled={category.required}
                          data-testid={`switch-${category.id}`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-3">
                        {category.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="font-medium text-gray-700">Examples:</span>
                          <ul className="mt-1 text-gray-600">
                            {category.examples.map((example, index) => (
                              <li key={index}>• {example}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Retention:</span>
                          <p className="mt-1 text-gray-600">{category.retention}</p>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Purposes:</span>
                          <ul className="mt-1 text-gray-600">
                            {category.purposes.map((purpose, index) => (
                              <li key={index}>• {purpose}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={acceptCustomPreferences}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
                data-testid="button-save-preferences"
              >
                {loading ? "Saving..." : "Save Preferences"}
              </Button>
              <Button
                variant="outline"
                onClick={acceptNecessaryOnly}
                disabled={loading}
                data-testid="button-necessary-only-detailed"
              >
                Necessary Only
              </Button>
              <Button
                variant="outline"
                onClick={acceptAllCookies}
                disabled={loading}
                data-testid="button-accept-all-detailed"
              >
                Accept All
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Important Information</span>
              </div>
              <p>
                • Consent is valid for 1 year from acceptance date<br/>
                • You can change your preferences at any time in the footer<br/>
                • Some features may be limited without functional cookies<br/>
                • Necessary cookies cannot be disabled as they're required for basic functionality
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CookieSettingsDialog({ trigger }: { trigger: React.ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadCurrentPreferences();
    }
  }, [isOpen]);

  const loadCurrentPreferences = () => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (stored) {
        const consentData: CookieConsentData = JSON.parse(stored);
        setPreferences(consentData.preferences);
      }
    } catch (error) {
      console.error('Error loading cookie preferences:', error);
    }
  };

  const savePreferences = () => {
    setLoading(true);
    
    try {
      const consentData: CookieConsentData = {
        hasConsented: true,
        consentDate: new Date().toISOString(),
        preferences,
        version: COOKIE_VERSION
      };

      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
      
      // Apply preferences immediately
      if (preferences.analytics) {
        (window as any).techlearnorbitAnalytics = true;
      } else {
        (window as any).techlearnorbitAnalytics = false;
      }

      setIsOpen(false);
      toast({
        title: "Preferences Updated",
        description: "Your cookie preferences have been updated successfully.",
      });

    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (category: keyof CookiePreferences, value: boolean) => {
    if (category === 'necessary') return;
    
    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie Preferences
          </DialogTitle>
          <DialogDescription>
            Manage your cookie preferences. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-4 p-1">
            {cookieCategories.map((category) => {
              const Icon = category.icon;
              const isEnabled = preferences[category.id];
              
              return (
                <Card key={category.id} className={`transition-all ${isEnabled ? 'ring-2 ring-blue-200' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${category.required ? 'text-red-500' : 'text-blue-500'}`} />
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {category.title}
                            {category.required && (
                              <Badge variant="secondary" className="text-xs">Required</Badge>
                            )}
                            {isEnabled && !category.required && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </CardTitle>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handlePreferenceChange(category.id, checked)}
                        disabled={category.required}
                        data-testid={`dialog-switch-${category.id}`}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-3">
                      {category.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">Examples:</span>
                        <ul className="mt-1 text-gray-600">
                          {category.examples.map((example, index) => (
                            <li key={index}>• {example}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Retention:</span>
                        <p className="mt-1 text-gray-600">{category.retention}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Purposes:</span>
                        <ul className="mt-1 text-gray-600">
                          {category.purposes.map((purpose, index) => (
                            <li key={index}>• {purpose}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={savePreferences}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 flex-1"
            data-testid="button-save-dialog-preferences"
          >
            {loading ? "Saving..." : "Save Preferences"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}