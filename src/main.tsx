import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const SimpleApp = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2563eb', textAlign: 'center' }}>
        🌟 OBC Faces of Philippines
      </h1>
      <p style={{ textAlign: 'center', color: '#666' }}>
        Global Online Beauty Contest
      </p>
      <div style={{ 
        background: '#f0f9ff', 
        padding: '20px', 
        borderRadius: '8px', 
        margin: '20px 0',
        textAlign: 'center'
      }}>
        <h2>✅ Site Loading Successfully!</h2>
        <p>Mobile optimized version is working</p>
        <button 
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            margin: '10px'
          }}
          onClick={() => alert('Button works!')}
        >
          Test Button
        </button>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<SimpleApp />);