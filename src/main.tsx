import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Минимальный компонент для проверки загрузки
const SimpleApp = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>
        OBC Faces of Philippines
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>
        Приложение успешно загружено на мобильном устройстве!
      </p>
      <div style={{
        padding: '12px 24px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.3)'
      }}>
        ✅ Все работает
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SimpleApp />
)
