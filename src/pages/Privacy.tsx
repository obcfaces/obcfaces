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
            <h1 className="text-3xl font-bold mb-8 text-center">🔒 Privacy Policy — obcface.com</h1>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-2">
                <strong>Effective Date:</strong> 13 August 2025 &nbsp;|&nbsp; <strong>Operator:</strong> OBCFaces — https://obcface.com
              </p>
            </div>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                This Privacy Policy explains how we collect, use, and protect your data when you use obcface.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
              <p className="mb-4">We may collect the following data:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Account Data:</strong> email, username, password.</li>
                <li><strong>Profile Data:</strong> gender, age, height, country, city of residence, and other profile fields you provide.</li>
                <li><strong>Content Data:</strong> photos (face and full-body), any contest submissions.</li>
                <li><strong>Usage Data:</strong> IP address, device/browser info, activity logs, contest participation.</li>
                <li><strong>Cookies & Tracking:</strong> see our Cookie Policy.</li>
                <li><strong>Additional Data:</strong> we may request further information (e.g., identity documents, payment details, contact info) if necessary for contest operation, fraud prevention, legal compliance, or prize payouts.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Data</h2>
              <p className="mb-4">We use your data to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>register accounts and verify eligibility;</li>
                <li>run contests and display content;</li>
                <li>detect and prevent fraud;</li>
                <li>improve and secure the Platform;</li>
                <li>communicate with you about results and updates;</li>
                <li>send marketing messages only with your consent.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Sharing Data</h2>
              <p className="mb-4">We do not sell your data. We may share it with:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>service providers (hosting, analytics, payments, moderation);</li>
                <li>legal authorities if required.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Account/content data:</strong> kept while your account is active.</li>
                <li><strong>Analytics:</strong> up to 13 months.</li>
                <li>If you delete your account, we remove or anonymize data unless retention is required by law.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p className="mb-4">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>access, correct, or delete your data;</li>
                <li>withdraw consent;</li>
                <li>object or restrict processing;</li>
                <li>complain to a data authority.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Security</h2>
              <p className="mb-4">
                We use reasonable measures (encryption, access control, secure servers). No system is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Minors</h2>
              <p className="mb-4">
                The Platform is 18+ only. Content involving minors is prohibited.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. International Transfers</h2>
              <p className="mb-4">
                Your data may be stored or processed in other countries. We ensure adequate protection in line with applicable laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
              <p className="mb-4">
                This Privacy Policy is governed by the laws of Kazakhstan, disputes handled in courts of Almaty, Kazakhstan.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Changes</h2>
              <p className="mb-4">
                We may update this Privacy Policy. The latest version will always be available at https://obcface.com/privacy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
              <p className="mb-4">Questions? Contact:</p>
              <p className="mb-4"><strong>📧 support@obcfaces.com</strong></p>
            </section>

            <hr className="my-8" />
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">
                &copy; <Link to="/" className="text-inherit hover:text-foreground transition-colors">obcfaces.com</Link> — All rights reserved.
              </p>
              <p>
                <Link to="/terms" className="text-inherit hover:text-foreground transition-colors">Terms of Service</Link> | {" "}
                <Link to="/privacy" className="text-inherit hover:text-foreground transition-colors">Privacy Policy</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;