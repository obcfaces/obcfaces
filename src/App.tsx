import React from 'react';

const App = () => {
  console.log('[APP] Ultra minimal version for mobile debugging');
  
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f5f5f5',
      padding: '16px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          backgroundColor: '#1976d2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          OBC
        </div>
        <button style={{
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          cursor: 'pointer'
        }}>
          Войти
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#333',
          marginBottom: '8px'
        }}>
          THIS WEEK
        </h1>
        
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '6px'
        }}>
          25 - 31 August 2025
        </p>
        
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '30px'
        }}>
          Help us choose the winner of the week.
        </p>

        {/* Contest Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}>
          {[
            { name: 'Maria Santos', city: 'Cebu', rating: '4.8' },
            { name: 'Anna Cruz', city: 'Manila', rating: '4.5' },
            { name: 'Sofia Reyes', city: 'Davao', rating: '4.2' },
            { name: 'Isabella Garcia', city: 'Quezon', rating: '3.9' },
            { name: 'Camila Torres', city: 'Makati', rating: '3.5' },
            { name: 'Valentina Lopez', city: 'Pasig', rating: '3.1' }
          ].map((contestant, index) => (
            <div key={index} style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                width: '100%',
                height: '140px',
                backgroundColor: '#dee2e6',
                borderRadius: '6px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6c757d',
                fontSize: '24px'
              }}>
                📸
              </div>
              
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0 0 4px 0',
                color: '#333'
              }}>
                {contestant.name}
              </h3>
              
              <p style={{
                fontSize: '12px',
                color: '#666',
                margin: '0 0 8px 0'
              }}>
                {contestant.city}, Philippines
              </p>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                <span style={{ color: '#ffc107' }}>★★★★★</span>
                <span style={{ fontSize: '12px', color: '#666' }}>{contestant.rating}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Join Contest */}
        <div style={{
          backgroundColor: '#e3f2fd',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1976d2',
            marginBottom: '12px'
          }}>
            Join the Contest!
          </h2>
          
          <p style={{
            color: '#666',
            marginBottom: '20px',
            fontSize: '16px'
          }}>
            Upload your photo and try to win 5000 PhP
          </p>
          
          <button style={{
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(25, 118, 210, 0.3)'
          }} onClick={() => {
            alert('Upload functionality works!');
            console.log('[MOBILE] Upload button clicked');
          }}>
            📸 Upload Your Photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;