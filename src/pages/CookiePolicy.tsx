import { Helmet } from "react-helmet-async";

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
              <strong>Operator:</strong> OBCFaces (https://obcface.com)
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files stored on your device when you visit our website. They help us recognize your browser, remember your preferences, and improve your experience.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Strictly Necessary Cookies</h3>
                  <p className="text-muted-foreground">Required for core site functionality (security, login, navigation). You cannot disable these.</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Analytics Cookies</h3>
                  <p className="text-muted-foreground">Help us understand how visitors use obcface.com (e.g., Google Analytics).</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Personalization Cookies</h3>
                  <p className="text-muted-foreground">Store your choices (language, layout, contest preferences).</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Marketing Cookies</h3>
                  <p className="text-muted-foreground">Used to deliver relevant ads and measure campaign effectiveness.</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Cookies</h2>
              <p className="text-muted-foreground mb-3">We use cookies to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>keep you logged in and secure your account;</li>
                <li>remember your preferences (language, region);</li>
                <li>analyze site traffic and improve performance;</li>
                <li>personalize your contest experience;</li>
                <li>serve relevant promotions (only if you consent).</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Managing Cookies</h2>
              <p className="text-muted-foreground mb-3">You can control cookies in two ways:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li><strong>On our website:</strong> via the cookie banner (Accept / Reject / Customize).</li>
                <li><strong>In your browser:</strong> you can delete or block cookies at any time (see instructions for Chrome, Safari, Firefox, Edge).</li>
              </ul>
              <p className="text-muted-foreground">
                <strong>Please note:</strong> blocking necessary cookies may affect how obcface.com functions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Third-Party Cookies</h2>
              <p className="text-muted-foreground mb-3">Some cookies are placed by third parties:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Google Analytics (analytics)</li>
                <li>Facebook Pixel (marketing, if enabled)</li>
                <li>Other service providers we may use</li>
              </ul>
              <p className="text-muted-foreground">These third parties have their own privacy policies.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Retention</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Session cookies:</strong> deleted when you close your browser.</li>
                <li><strong>Persistent cookies:</strong> remain until expiry or deletion by you.</li>
                <li>Retention period does not exceed 13 months (per GDPR/ePrivacy rules).</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Your Rights</h2>
              <p className="text-muted-foreground mb-3">
                Depending on your location (EU/EEA, UK, California, etc.), you may have rights to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>withdraw consent at any time;</li>
                <li>request access, correction, or deletion of your personal data.</li>
              </ul>
              <p className="text-muted-foreground">See our Privacy Policy for details.</p>
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
              <p className="text-muted-foreground mb-2">If you have questions about cookies or your data, contact us at:</p>
              <p className="text-muted-foreground">
                📧 <a href="mailto:support@obcfaces.com" className="text-primary underline hover:no-underline">
                  support@obcfaces.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookiePolicy;