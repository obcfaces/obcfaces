import React from 'react';

const App = () => {
  console.log('[APP] Simple app loaded');
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '24px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          OBC Faces of Philippines
        </h1>
        
        <p style={{
          color: '#666',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          App loaded successfully on mobile!
        </p>
        
        <button 
          style={{
            width: '100%',
            backgroundColor: '#007bff',
            color: 'white',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
          onClick={() => {
            alert('Button works!');
            console.log('[MOBILE] Button clicked');
          }}
        >
          Test Button
        </button>
      </div>
    </div>
  );
};

export default App;