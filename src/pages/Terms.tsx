import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service</title>
        <meta name="description" content="Terms of Service and community guidelines" />
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
            <h1 className="text-3xl font-bold mb-8 text-center">📜 Terms of Service — obcface.com</h1>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-2">
                <strong>Effective Date:</strong> 13 August 2025 &nbsp;|&nbsp; <strong>Operator:</strong> OBCFaces — https://obcface.com
              </p>
            </div>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to OBCFaces (the "Platform"), an online beauty contest platform. By using our Services, you agree to these Terms of Service and our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You must be 18 years or older to register, upload content, or participate.</li>
                <li>By using the Platform, you confirm that you are legally allowed to do so in your jurisdiction.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide truthful and accurate information.</li>
                <li>Keep your credentials secure.</li>
                <li>We may suspend or terminate accounts that violate these Terms.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Content Rules</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You must own or have rights to all content you upload.</li>
                <li><strong>Prohibited content includes:</strong> nudity/sexual content, depictions of minors, hate speech, harassment, fraudulent content, manipulated or AI-generated images of real persons without consent, vote manipulation.</li>
                <li>We may remove or block any content that violates rules.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Voting & Competitions</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Voting is limited to registered users.</li>
                <li>Bots, scripts, fake accounts are forbidden.</li>
                <li>Fraud or manipulation may result in disqualification or account removal.</li>
                <li>We reserve the right to adjust or nullify votes if fraud is detected.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Prizes & Payments</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>The Platform awards weekly and annual prizes to winners.</li>
                <li>Specific prize amounts, payment methods, and schedules are published on the Platform and may change over time.</li>
                <li>Prizes are paid within a reasonable period after winner verification.</li>
                <li>Winners are responsible for any local taxes or fees.</li>
                <li>Identity verification may be requested before payout.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Termination & Suspension</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>We may suspend or terminate accounts for violations, fraud, or unlawful use.</li>
                <li>Termination ends your access, and your content may be removed.</li>
                <li>You may request account deletion via support@obcfaces.com.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You retain ownership of your content.</li>
                <li>By submitting content, you grant OBCFaces a non-exclusive, worldwide, royalty-free license to use, display, distribute, and promote your content in connection with the Platform and marketing.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. AI Features</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>The Platform may use AI to generate descriptions, suggestions, or analytics.</li>
                <li>AI outputs may contain errors and are informational only.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Liability & Indemnity</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>The Platform is provided "as is," without warranties.</li>
                <li>We are not liable for damages arising from user content or use of the Services.</li>
                <li>You agree to indemnify OBCFaces against claims resulting from your violation of these Terms.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Governing Law & Disputes</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>These Terms are governed by the laws of Kazakhstan.</li>
                <li>Disputes will be resolved exclusively in the courts of Almaty, Kazakhstan.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Changes</h2>
              <p className="mb-4">
                We may update these Terms. The latest version is available at https://obcface.com/terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
              <p className="mb-4">Questions? Contact us:</p>
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

export default Terms;