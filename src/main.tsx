import React from 'react'
import ReactDOM from 'react-dom/client'

// Простой React компонент для тестирования
const TestApp = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f0f0',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{color: '#333', marginBottom: '20px'}}>React тест</h1>
        <p style={{color: '#666', marginBottom: '20px'}}>Если видите это - React работает</p>
        <button 
          onClick={() => alert('React кнопка работает!')}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          React Тест
        </button>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<TestApp />);
