import React from "react";

const Index = () => {
  console.log('[INDEX] Ultra minimal mobile version');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Top bar */}
      <div style={{
        backgroundColor: 'white',
        padding: '10px 20px',
        marginBottom: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#1976d2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          obc
        </div>
        <button style={{
          backgroundColor: '#1976d2',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          Войти
        </button>
      </div>

      {/* Main content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '10px',
          color: '#333'
        }}>
          THIS WEEK
        </h1>
        
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '20px'
        }}>
          25 - 31 August 2025
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          {['Maria Santos', 'Anna Cruz', 'Sofia Reyes'].map((name, index) => (
            <div key={index} style={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '100%',
                height: '120px',
                backgroundColor: '#ddd',
                borderRadius: '4px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
              }}>
                📸
              </div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                margin: '0 0 5px 0'
              }}>
                {name}
              </h3>
              <p style={{
                fontSize: '12px',
                color: '#666',
                margin: 0
              }}>
                Philippines
              </p>
            </div>
          ))}
        </div>

        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1976d2',
            marginBottom: '10px'
          }}>
            Join the Contest!
          </h2>
          <p style={{
            color: '#666',
            marginBottom: '15px'
          }}>
            Upload your photo and win 5000 PhP
          </p>
          <button style={{
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }} onClick={() => alert('Upload works!')}>
            📸 Upload Your Photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;