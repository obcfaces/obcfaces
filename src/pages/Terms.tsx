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
            <h1 className="text-3xl font-bold mb-8 text-center">Terms of Service — obcface.com</h1>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-2">
                <strong>Effective Date:</strong> 13 August 2025 &nbsp;|&nbsp; <strong>Operator:</strong> OBCFaces — https://obcface.com
              </p>
            </div>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to <strong>OBCFaces</strong> (the "Platform"), an online beauty contest platform where users can participate in weekly and annual competitions, vote for contestants, and interact with the services (the "Services"). By accessing or using our Services, you agree to these Terms of Service and our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Minimum Age:</strong> You must be 18 years or older to register, upload content, or participate in contests.</li>
                <li>By using the Platform, you confirm that you are legally allowed to view and share contest content in your jurisdiction.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You must provide truthful and accurate information during registration.</li>
                <li>You are responsible for securing your account and password.</li>
                <li>The Platform may suspend or terminate accounts that violate these Terms.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Content Rules</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You confirm you own or have permission to share all uploaded content.</li>
                <li><strong>Prohibited content includes:</strong> nudity or sexual content; exploitation or depiction of minors; hate speech, harassment, or threats; fraudulent or manipulated content; AI-generated images of real persons without consent; vote manipulation.</li>
                <li>All content must follow community guidelines and respect the rights of others.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Voting & Competitions</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Votes are allowed only for registered users. Bots, scripts, and fake accounts are forbidden.</li>
                <li>False reporting, harassment, or vote manipulation may lead to disqualification and account removal.</li>
                <li>The Platform may adjust or nullify votes if manipulation is detected.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Prizes & Payments</h2>
              <p className="mb-4">
                The Platform awards weekly and annual prizes to winners. The specific amounts, frequency, and payment methods are announced on the Platform and may change over time. Winners are responsible for any local taxes or fees related to receiving the prize.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Termination & Suspension</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>We may suspend or terminate your account for violations of these Terms, fraudulent activity, or unlawful behavior.</li>
                <li>Upon termination, your access to the Platform ends, and your content may be removed.</li>
                <li>You may request account deletion at any time by contacting support@obcfaces.com.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You retain ownership of your content.</li>
                <li>By submitting content, you grant OBCFaces a non-exclusive, worldwide, royalty-free license to use, display, distribute, and promote your content in connection with the Platform and related marketing.</li>
                <li>Unauthorized use of Platform content outside OBCFaces without permission is prohibited.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. AI Features</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>The Platform may use AI to generate descriptions, suggestions, or analysis of entries.</li>
                <li>AI outputs may not always be accurate and should be considered informational only.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Liability & Disclaimer</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>The Platform is provided "as is," without warranties of any kind.</li>
                <li>OBCFaces is not responsible for user content, actions of users, or damages arising from your use of the Services.</li>
                <li>You agree to indemnify and hold OBCFaces harmless from any claims or damages resulting from your violation of these Terms or misuse of the Services.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Governing Law & Dispute Resolution</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>These Terms are governed by the laws of Kazakhstan.</li>
                <li>Any disputes shall be resolved exclusively in the courts of Almaty, Kazakhstan.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
              <p className="mb-4">
                We may update these Terms from time to time. Continued use of the Platform after updates means you accept the revised Terms. The latest version will always be available at https://obcface.com/terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
              <p className="mb-4">
                If you have questions about these Terms, please contact us:<br />
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

export default Terms;