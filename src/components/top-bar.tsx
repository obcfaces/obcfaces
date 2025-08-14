import { Link } from "react-router-dom";
import AuthNav from "@/components/auth-nav";
import GlobalSearch from "@/components/global-search";

const TopBar = () => {
  return (
    <header role="banner" className="w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container mx-auto flex justify-between items-center gap-2 px-4 py-2" aria-label="Main navigation">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
            aria-label="На главную"
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
