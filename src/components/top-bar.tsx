import React from "react";
import { Link } from "react-router-dom";

const TopBar = () => {
  console.log('[TOPBAR] Simple version without Supabase');
  
  return (
    <header className="w-full bg-white border-b border-border px-4 py-2">
      <nav className="flex justify-between items-center max-w-6xl mx-auto gap-2">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-foreground no-underline"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              obc
            </span>
          </Link>
          
          {/* Simple Search Icon - no functionality to avoid complexity */}
          <button
            className="p-2 hover:bg-accent rounded-md transition-colors hidden sm:flex"
            aria-label="Search"
          >
            🔍
          </button>
        </div>
        
        {/* Simple Login Button */}
        <Link
          to="/auth"
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:bg-primary/90 transition-colors no-underline"
        >
          Войти
        </Link>
      </nav>
    </header>
  );
};

export default TopBar;
