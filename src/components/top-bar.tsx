import React from "react";
import { Link } from "react-router-dom";

const TopBar = () => {
  console.log('[TOPBAR] Simple version rendering');
  
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
      </nav>
    </header>
  );
};

export default TopBar;
