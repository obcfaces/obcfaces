// Простой статичный HTML для проверки мобильного
document.getElementById('root')!.innerHTML = `
  <div style="
    min-height: 100vh;
    background: #f0f0f0;
    padding: 20px;
    font-family: Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      background: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      max-width: 400px;
      width: 100%;
    ">
      <h1 style="color: #333; margin-bottom: 20px;">Тест мобильного</h1>
      <p style="color: #666; margin-bottom: 20px;">Если видите это - HTML работает</p>
      <button onclick="alert('Кнопка работает!')" style="
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
      ">Тест</button>
    </div>
  </div>
`;

console.log('[MOBILE-TEST] Статичный HTML загружен');
