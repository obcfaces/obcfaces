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
            <h1 className="text-3xl font-bold mb-8 text-center">OBCFaces — Privacy Policy</h1>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-2">
                <strong>Last updated:</strong> August 13, 2025 &nbsp;|&nbsp; <strong>Effective date:</strong> August 13, 2025
              </p>
            </div>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                This Privacy Policy explains how <strong>OBCFaces</strong> ("we," "us," "our") collects, uses, and protects your personal data when you use our beauty contest platform ("Platform"). By using OBCFaces, you agree to the collection and use of your information as described in this Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, date of birth, profile photo.</li>
                <li><strong>Contest Data:</strong> Uploaded photos, captions, votes, comments.</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, cookies.</li>
                <li><strong>Parental Consent Data:</strong> For minors (ages 13–17), verifiable parental or guardian consent documentation.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Operate and improve the Platform.</li>
                <li>Manage contests, votes, and prize distributions.</li>
                <li>Moderate content and prevent abuse.</li>
                <li>Send notifications about contests, updates, and changes to our policies.</li>
                <li>Generate AI-powered descriptions and recommendations.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Deepfake & AI Content Protection</h2>
              <p className="mb-4">
                We use automated tools and human moderation to detect manipulated or AI-generated content. Misuse of deepfake or AI-generated images of real persons without consent may lead to removal, account termination, and reporting to authorities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Protection of Minors</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>All images of minors are reviewed by human moderators before publication.</li>
                <li>No personal contact details of minors are publicly displayed.</li>
                <li>Parents/guardians may request the removal of their child's content and data at any time.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Data Sharing</h2>
              <p className="mb-4">
                We do not sell your personal data. We may share it only with service providers (hosting, analytics, moderation tools, payment processors), legal authorities when required by law or to protect user safety, and parents/guardians regarding minor participants.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies & Tracking</h2>
              <p className="mb-4">
                We use cookies and similar tracking technologies to keep you logged in, analyze site performance, and improve user experience. You may disable cookies in your browser settings, but this may affect site functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
              <p className="mb-4">
                We retain personal data only as long as necessary for the purposes described in this Policy or as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Your Rights</h2>
              <p className="mb-4">
                Depending on your jurisdiction (including GDPR-covered regions), you may have the right to access, correct, or delete your personal data; withdraw consent (for minors, parents/guardians may withdraw consent); request restriction or objection to certain processing; and request data portability in a structured, machine-readable format.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
              <p className="mb-4">
                Your data may be transferred and processed in other countries. We ensure adequate safeguards in accordance with applicable data protection laws (including GDPR where applicable).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Privacy Policy</h2>
              <p className="mb-4">
                We may update this Policy from time to time. Continued use of the Platform after updates means you accept the revised Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
              <p className="mb-4">
                <strong>Email:</strong> privacy@obcfaces.com
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