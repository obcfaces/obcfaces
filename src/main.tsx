import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom"

// Простая главная страница без сложных зависимостей
const Index = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          OBC Faces of Philippines
        </h1>
        
        <div style={{
          background: '#e3f2fd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#1976d2', margin: '0 0 10px 0' }}>
            Global Online Beauty Contest
          </h2>
          <p style={{ color: '#555', margin: 0 }}>
            Natural. Honest. Voted by People. Upload your photos and try to win!
          </p>
        </div>
        
        <button
          style={{
            width: '100%',
            background: '#1976d2',
            color: 'white',
            padding: '15px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
          onClick={() => alert('Кнопка работает!')}
        >
          📸 Load your photo and win 5000 Php
        </button>
      </div>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
