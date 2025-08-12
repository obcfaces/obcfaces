import { Link } from "react-router-dom";
import GlobalSearch from "@/components/global-search";

const TopBar = () => {
  return (
    <div role="region" aria-label="Глобальная панель" className="border-b bg-background">
      <div className="mx-auto max-w-screen-xl h-12 px-3 flex items-center justify-between gap-3">
        <Link to="/" aria-label="На главную" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 text-primary grid place-items-center font-semibold">
            O
          </div>
          <span className="font-semibold tracking-wide">OBC</span>
        </Link>
        <GlobalSearch />
      </div>
    </div>
  );
};

export default TopBar;
