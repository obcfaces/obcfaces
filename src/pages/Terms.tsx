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
            <h1 className="text-3xl font-bold mb-8 text-center">Terms of Service</h1>
            
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
                Welcome to [Site Name] ("Platform"), an online beauty contest platform where users can participate in weekly competitions, vote for contestants, and interact with AI-powered features ("Services"). By accessing or using our Services, you agree to these Terms and our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Minimum Age: 13 years old.</li>
                <li>Minors (13–17): Participation only with verified parental/guardian consent.</li>
                <li>Adults: 18+ without extra consent.</li>
                <li>Jurisdiction: You must comply with your local laws regarding age and content.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              <p className="mb-4">
                You must provide truthful and accurate information. You are responsible for securing your account and password. We may suspend or terminate accounts that violate the Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Content Rules</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You confirm you own or have permission to share uploaded content.</li>
                <li>Prohibited: nudity, sexual content, exploitation of minors, hate speech, threats, AI deepfakes without consent, fraudulent content.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Deepfake & AI Content Policy</h2>
              <p className="mb-4">
                All AI-generated or altered images must be clearly labeled. Uploading deepfake or AI-altered images of real persons without consent is prohibited and may result in account termination and legal action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Voting & Competition Rules</h2>
              <p className="mb-4">
                Votes are for registered users only. Bots, scripts, fake accounts are forbidden. False reporting or harassment leads to penalties or bans. We may adjust or nullify votes if manipulation is detected.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. AI Features Transparency</h2>
              <p className="mb-4">
                Our AI may generate photo descriptions, suggestions, and analyze entries. AI outputs may not always be accurate and should be considered informational only.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Special Rules for Minors' Content</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>All minors' photos reviewed by human moderators.</li>
                <li>No public display of minors' contact details.</li>
                <li>Parents/guardians can request removal at any time.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
              <p className="mb-4">
                You retain ownership of your content but grant us a license to use it in connection with the Platform. Unauthorized external use is prohibited.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Liability & Disclaimer</h2>
              <p className="mb-4">
                Platform is provided "as is" without warranties. We are not responsible for user content or damages from use.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
              <p className="mb-4">
                We may update Terms anytime. Continued use means acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
              <p className="mb-4">
                Email: [Support Email]
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;