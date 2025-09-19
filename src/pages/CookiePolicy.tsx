import { Helmet } from "react-helmet-async";
import { CookiePreferencesManager } from "@/components/cookie-preferences-manager";

const CookiePolicy = () => {
  return (
    <>
      <Helmet>
        <title>Cookie Policy - obcface.com</title>
        <meta name="description" content="Cookie Policy for obcface.com - Learn how we use cookies and manage your preferences" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              🍪 Cookie Policy — obcface.com
            </h1>
            <p className="text-muted-foreground mb-8">
              <strong>Effective date:</strong> 13 August 2025<br />
              <strong>Operator:</strong> OBCFaces — https://obcface.com
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files placed on your device when you visit our website. They help us keep the site secure, remember your preferences, and improve your experience.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Strictly Necessary Cookies</h3>
                  <p className="text-muted-foreground">Required for core site functions (login, security, navigation). These cannot be disabled.</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Analytics Cookies</h3>
                  <p className="text-muted-foreground">Help us understand how visitors use obcface.com (e.g., Google Analytics).</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Personalization Cookies</h3>
                  <p className="text-muted-foreground">Store your preferences such as language and contest settings.</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Marketing Cookies</h3>
                  <p className="text-muted-foreground">Used to deliver relevant promotions and measure campaigns (e.g., Meta Pixel).</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Cookies</h2>
              <p className="text-muted-foreground mb-3">We use cookies to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>keep you signed in and secure your account;</li>
                <li>remember your preferences (e.g., language, region);</li>
                <li>analyze traffic and improve performance;</li>
                <li>personalize your contest experience;</li>
                <li>provide relevant promotions, if you consent.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Managing Cookies</h2>
              <p className="text-muted-foreground mb-3">You can manage cookies in two ways:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li><strong>On our site</strong> — via the cookie banner where you can Accept all, Reject all, or Customize.</li>
                <li><strong>In your browser</strong> — you can delete or block cookies at any time (see help pages for Chrome, Safari, Firefox, Edge).</li>
              </ul>
              <p className="text-muted-foreground">
                <strong>Note:</strong> blocking necessary cookies may affect how obcface.com works.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Third-Party Cookies</h2>
              <p className="text-muted-foreground mb-3">Some cookies are placed by third parties, including:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Google Analytics — analytics and usage statistics;</li>
                <li>Meta (Facebook) Pixel — marketing and advertising;</li>
                <li>Other service providers we may use for performance and security.</li>
              </ul>
              <p className="text-muted-foreground">Each provider has its own privacy policy.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Retention</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Session cookies are deleted when you close your browser.</li>
                <li>Persistent cookies stay until their expiry date or until you delete them.</li>
                <li>No cookies remain longer than 13 months (per GDPR/ePrivacy rules).</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Your Rights</h2>
              <p className="text-muted-foreground mb-3">
                Depending on your location (EU/EEA, UK, California, etc.), you may have the right to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>withdraw consent at any time;</li>
                <li>request access, correction, or deletion of your data.</li>
              </ul>
              <p className="text-muted-foreground">For details, see our Privacy Policy.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Updates</h2>
              <p className="text-muted-foreground mb-2">We may update this Cookie Policy. The latest version will always be available at:</p>
              <p className="text-muted-foreground">
                👉 <a href="https://obcface.com/cookie-policy" className="text-primary underline hover:no-underline">
                  https://obcface.com/cookie-policy
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact</h2>
              <p className="text-muted-foreground mb-2">Questions about cookies? Contact:</p>
              <p className="text-muted-foreground">
                📧 <a href="mailto:support@obcfaces.com" className="text-primary underline hover:no-underline">
                  support@obcfaces.com
                </a>
              </p>
            </section>

            {/* Cookie Preferences Manager */}
            <section className="mb-8">
              <CookiePreferencesManager />
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookiePolicy;