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
            <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy — obcface.com</h1>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-2">
                <strong>Effective Date:</strong> 13 August 2025 &nbsp;|&nbsp; <strong>Operator:</strong> OBCFaces — https://obcface.com
              </p>
            </div>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                Your privacy is important to us. This Privacy Policy explains how <strong>OBCFaces</strong> ("we", "us", "our") collects, uses, discloses, and protects your personal data when you use our website https://obcface.com (the "Site") and our services (the "Services").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
              <p className="mb-4">We collect the following types of personal data:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Account Data:</strong> email address, username, password.</li>
                <li><strong>Content Data:</strong> photos you upload (face and full-body), profile information.</li>
                <li><strong>Usage Data:</strong> IP address, browser type, device type, pages visited, time spent, contests participated in.</li>
                <li><strong>Cookies & Tracking Data:</strong> data collected via cookies and similar tracking technologies.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
              <p className="mb-4">We use your data for these purposes:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>To enable account registration, login, and identity verification.</li>
                <li>To allow submission, storage, and display of your photos in contests.</li>
                <li>For moderation, fraud detection, preventing misuse.</li>
                <li>To analyze usage, improve our Services, and debug and secure the Site.</li>
                <li>To communicate with you (e.g., notifications about contests, winner announcements).</li>
                <li>For marketing or promotional purposes — only if you explicitly consent.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Sharing & Disclosure</h2>
              <p className="mb-4">We do not sell your personal data.</p>
              <p className="mb-4">We may share data with:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Service providers who assist us with operations, hosting, analytics, payments, content moderation.</li>
                <li>Legal authorities if required by law or in response to valid requests.</li>
              </ul>
              <p className="mb-4">All third parties we share with must respect confidentiality and only process data as instructed by us.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>We retain account and content data for as long as your account is active.</li>
                <li>Usage and analytics data may be retained for up to 13 months unless longer retention is required by law.</li>
                <li>If you request account deletion, we will remove or anonymize your personal data within reasonable time, except where law requires retention (e.g., financial transaction records).</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p className="mb-4">Depending on your country/region, you may have the following rights:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Access the personal data we hold about you.</li>
                <li>Correct or update your information.</li>
                <li>Request deletion or anonymization of your data.</li>
                <li>Withdraw consent for data processing (where processing is based on consent).</li>
                <li>Object to or restrict certain processing.</li>
                <li>Complain to a data protection authority.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies & Tracking</h2>
              <p className="mb-4">
                We use cookies and similar technologies (see our Cookie Policy) to recognize you, collect analytics, show preferences, and display marketing/promotional content (only with your consent for non-essential cookies).
              </p>
              <p className="mb-4">You can manage cookies via browser settings or via our cookie banner.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Security</h2>
              <p className="mb-4">
                We take reasonable technical and organizational measures to protect your data, including encryption in transit, secure servers, and access controls. However, no system is perfect; we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Minors</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Our Services are for adults (18+). If you are under 18, you cannot register, upload content, or participate.</li>
                <li>Content depicting minors is strictly prohibited.</li>
                <li>If we become aware of such content or use, we will remove it and take appropriate action.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
              <p className="mb-4">
                Your data may be transferred to and stored in jurisdictions other than your own country, including servers or service providers in other countries. We ensure adequate protections and compliance with applicable laws in any transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Governing Law & Dispute Resolution</h2>
              <p className="mb-4">
                This Privacy Policy is governed by the laws of Kazakhstan. Any disputes arising under or in connection with this Privacy Policy shall be resolved exclusively in the courts of Almaty, Kazakhstan.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Changes to Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will post the revised version at https://obcface.com/privacy. Continued use of the Site after updates means you accept the revised policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
              <p className="mb-4">
                If you have questions or concerns about this policy or your personal data, please contact us:<br />
                <strong>📧 support@obcfaces.com</strong>
              </p>
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