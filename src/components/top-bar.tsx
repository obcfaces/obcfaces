import { Link } from "react-router-dom";
import AuthNav from "@/components/auth-nav";
import GlobalSearch from "@/components/global-search";

const TopBar = () => {
  console.log('TopBar rendering');
  return (
    <header role="banner" className="w-full bg-background border-b">
      <nav className="container mx-auto flex justify-between items-center gap-2 px-4 py-2" aria-label="Main navigation">
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
        <AuthNav />
      </nav>
    </header>
  );
};

export default TopBar;
