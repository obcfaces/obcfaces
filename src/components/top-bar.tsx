import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const TopBar = () => {
  console.log('[TOPBAR] Mobile optimized version');
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    
    // Оптимизация для мобильных - один запрос вместо двух
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.log('[TOPBAR] Auth error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Упрощенный listener без дополнительных запросов
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
          
          {/* Simple Search - скрыт на мобильных для оптимизации */}
          {!searchOpen && (
            <button
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                borderRadius: '4px',
                display: window.innerWidth > 768 ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              🔍
            </button>
          )}
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
            to={`/profile/${user.id}`}
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
