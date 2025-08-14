import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Обработка ошибок React
window.addEventListener('error', (e) => {
  console.error('React error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Promise rejection:', e.reason);
});

// Простой компонент для теста рендеринга
const TestApp = () => {
  try {
    return (
      <div style={{
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1>OBC Faces of Philippines</h1>
        <p>React приложение успешно отрендерилось!</p>
        <button onClick={() => alert('Кнопка работает!')}>
          Тест
        </button>
      </div>
    );
  } catch (error) {
    console.error('Render error:', error);
    return <div>Ошибка рендеринга: {String(error)}</div>;
  }
};

try {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(<TestApp />);
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Mount error:', error);
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; color: red;">
      <h2>Ошибка загрузки React:</h2>
      <p>${String(error)}</p>
    </div>
  `;
}
