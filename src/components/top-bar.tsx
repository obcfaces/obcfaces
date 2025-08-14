import { Link } from "react-router-dom";
import AuthNav from "@/components/auth-nav";
import GlobalSearch from "@/components/global-search";

const TopBar = () => {
  return (
    <header role="banner" className="w-full bg-background border-b">
      <nav className="max-w-6xl mx-auto flex justify-between items-center gap-2 px-6 py-2" aria-label="Main navigation">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
            aria-label="Home"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              obc
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Contest
            </Link>
            <Link
              to="#"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              How it works
            </Link>
          </div>
          
          <GlobalSearch />
        </div>
        <AuthNav />
      </nav>
    </header>
  );
};

export default TopBar;
