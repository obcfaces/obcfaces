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
            <h1 className="text-3xl font-bold mb-8 text-center">OBCFaces — Terms of Service</h1>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-2">
                <strong>Last updated:</strong> August 13, 2025 &nbsp;|&nbsp; <strong>Effective date:</strong> August 13, 2025
              </p>
            </div>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to <strong>OBCFaces</strong> ("Platform"), an online beauty contest platform where users can participate in weekly competitions, vote for contestants, and interact with AI-powered features ("Services"). By accessing or using our Services, you agree to these Terms and our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Minimum Age:</strong> 13 years old.</li>
                <li><strong>Minors (13–17):</strong> Participation only with verified parental/guardian consent.</li>
                <li><strong>Adults:</strong> 18+ without extra consent.</li>
                <li><strong>Jurisdiction:</strong> You must comply with your local laws regarding age and content.</li>
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
                <li><strong>Prohibited content includes:</strong> nudity or sexual content; exploitation or sexualized depiction of minors; hate speech, threats, or harassment; AI deepfakes or manipulated images without consent; fraudulent content or vote manipulation.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Deepfake & AI Content Policy</h2>
              <p className="mb-4">
                All AI-generated or altered images must be clearly labeled as such. Uploading deepfake or AI-altered images of real persons without consent is prohibited and may result in account termination and legal action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Voting & Competition Rules</h2>
              <p className="mb-4">
                Votes are for registered users only. Bots, scripts, and fake accounts are forbidden. False reporting or harassment leads to penalties or bans. We may adjust or nullify votes if manipulation is detected.
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
                <li>All minors' photos are reviewed by human moderators before publication.</li>
                <li>No public display of minors' contact details.</li>
                <li>Parents/guardians can request removal of their child's data at any time.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
              <p className="mb-4">
                You retain ownership of your content but grant OBCFaces a non-exclusive, worldwide, royalty-free license to use, display, distribute, and promote it in connection with the Platform and related marketing. Unauthorized use of Platform content outside OBCFaces without written permission is prohibited.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Liability & Disclaimer</h2>
              <p className="mb-4">
                The Platform is provided "as is" without warranties of any kind. OBCFaces is not responsible for user content, actions of other users, or damages arising from your use of the Services. In jurisdictions with applicable laws such as GDPR, users have rights as outlined in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
              <p className="mb-4">
                We may update these Terms at any time. Continued use of the Platform after updates means you accept the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
              <p className="mb-4">
                <strong>Email:</strong> support@obcfaces.com
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