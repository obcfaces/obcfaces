import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-12">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-foreground mb-4">OBC - Online Beauty Contest</h3>
            <p className="text-muted-foreground text-sm mb-4">
              The world&apos;s weekly online beauty contest. A global platform that celebrates 
              natural beauty and talent in different categories of participants, offering 
              exciting prizes and international recognition.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-md font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Contest
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/messages" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Messages
                </Link>
              </li>
              <li>
                <Link to="/likes" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Likes
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-md font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-muted-foreground text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} OBC - Online Beauty Contest. All rights reserved.
          </div>
          
          <div className="text-muted-foreground text-sm">
            Made with ❤️
          </div>
        </div>
      </div>
    </footer>
  );
};