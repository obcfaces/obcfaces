import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import AuthNav from "@/components/auth-nav";
import GlobalSearch from "@/components/global-search";

const MobileSafeTopBar = () => {
  return (
    <header role="banner" className="w-full bg-background border-b">
      <nav className="max-w-6xl mx-auto flex justify-between items-center gap-2 px-6 py-2" aria-label="Main navigation">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
            aria-label="Home"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              obc
            </span>
          </Link>
          <GlobalSearch />
        </div>
        
        <div className="flex items-center gap-4">
          {/* Messages Icon without unread count for mobile safety */}
          <Link
            to="/messages"
            className="relative inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-accent transition-colors"
            aria-label="Messages"
          >
            <MessageCircle className="h-5 w-5 text-foreground" />
          </Link>
          
          <AuthNav />
        </div>
      </nav>
    </header>
  );
};

export default MobileSafeTopBar;