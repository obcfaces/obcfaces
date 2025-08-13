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
            <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
            
            <p className="text-muted-foreground mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using our platform, you accept and agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Age Requirements</h2>
              <p className="mb-4">
                You must be at least 18 years old to use our service. By using our platform, you represent and warrant that you are at least 18 years of age.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Conduct</h2>
              <p className="mb-4">You agree not to use the service to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Upload, post, or transmit any content that is harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable</li>
                <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity</li>
                <li>Upload, post, or transmit any content that you do not have a right to transmit under any law or under contractual or fiduciary relationships</li>
                <li>Upload, post, or transmit any content that infringes any patent, trademark, trade secret, copyright, or other proprietary rights of any party</li>
                <li>Engage in any form of harassment, bullying, or stalking of other users</li>
                <li>Share explicit or inappropriate content</li>
                <li>Attempt to gain unauthorized access to other user accounts or the platform's systems</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Content and Intellectual Property</h2>
              <p className="mb-4">
                You retain ownership of content you submit, post, or display on or through the service. However, by submitting content, 
                you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, 
                transmit, display, and distribute such content in any and all media or distribution methods.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Privacy and Data Protection</h2>
              <p className="mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, 
                to understand our practices regarding the collection, use, and disclosure of your personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Account Termination</h2>
              <p className="mb-4">
                We reserve the right to terminate or suspend your account and access to the service at our sole discretion, 
                without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, 
                us, or third parties, or for any other reason.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
                resulting from your use of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any material changes 
                to these terms by posting the new terms on this page. Your continued use of the service after 
                such modifications will constitute your acknowledgment of the modified terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us through our support channels.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;