import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const TopBar = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header style={{
      width: '100%',
      background: 'white',
      borderBottom: '1px solid #e0e0e0',
      padding: '8px 16px'
    }}>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              color: '#333',
              textDecoration: 'none'
            }}
          >
            <span style={{
              display: 'flex',
              height: '32px',
              width: '32px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: '#1976d2',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              obc
            </span>
          </Link>
          
          {/* Simple Search */}
          <div style={{ position: 'relative' }}>
            {!searchOpen ? (
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                🔍
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                    if (e.key === 'Escape') {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  placeholder="Поиск пользователей..."
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '200px'
                  }}
                  autoFocus
                />
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  aria-label="Close search"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Auth Navigation */}
        {loading ? (
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}>
            ...
          </div>
        ) : !user ? (
          <Link
            to="/auth"
            style={{
              padding: '8px 16px',
              background: '#1976d2',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            Войти
          </Link>
        ) : (
          <Link
            to={`/u/${user.id}`}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#1976d2',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600'
            }}
            title="Мой профиль"
          >
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </Link>
        )}
      </nav>
    </header>
  );
};

export default TopBar;
