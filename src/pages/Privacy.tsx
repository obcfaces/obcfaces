import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy</title>
        <meta name="description" content="Privacy Policy and data protection information" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          
          <div className="prose prose-gray max-w-none">
            <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-2">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-muted-foreground">
                <strong>Effective date:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                This Privacy Policy explains how [Site Name] ("we," "us") collects, uses, and protects your personal data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Account Information: name, email, date of birth, profile photo.</li>
                <li>Contest Information: uploaded photos, votes, comments.</li>
                <li>Technical Data: IP address, device info, browser type, cookies.</li>
                <li>Parental Consent Data for minors.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>To operate and improve the Platform.</li>
                <li>To run competitions and manage votes.</li>
                <li>To moderate content and prevent abuse.</li>
                <li>To inform users about contests and updates.</li>
                <li>For AI-based recommendations and descriptions.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Deepfake & AI Content Protection</h2>
              <p className="mb-4">
                We use automated and manual checks to detect manipulated or AI-generated content. Misuse may lead to removal and legal reporting.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Protection of Minors</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Strict moderation of minors' photos.</li>
                <li>No public contact details.</li>
                <li>Parents/guardians can withdraw consent anytime.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Data Sharing</h2>
              <p className="mb-4">
                We do not sell your data. We share only with service providers, legal authorities when required, and parents/guardians for minors.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies & Tracking</h2>
              <p className="mb-4">
                We use cookies for authentication, analytics, and experience improvement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
              <p className="mb-4">
                Data is kept as long as necessary or required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. User Rights</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Access, correct, or delete your data.</li>
                <li>Withdraw consent.</li>
                <li>Request removal of specific content.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. International Transfers</h2>
              <p className="mb-4">
                Your data may be processed in other countries with safeguards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Policy</h2>
              <p className="mb-4">
                We may update this Policy anytime. Continued use means acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
              <p className="mb-4">
                Email: [Privacy Email]
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;