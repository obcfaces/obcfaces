import { useState } from "react";

const IndexSimple = () => {
  console.log('[INDEX-SIMPLE] Rendering simple version');
  
  const [testCount, setTestCount] = useState(0);
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
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
          backgroundColor: '#e3f2fd',
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
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '15px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '20px',
            cursor: 'pointer'
          }}
          onClick={() => {
            setTestCount(prev => prev + 1);
            alert(`Button clicked ${testCount + 1} times! Mobile works!`);
          }}
        >
          📸 Load your photo and win 5000 Php
        </button>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>THIS WEEK</div>
            <div style={{ fontSize: '12px', color: '#666' }}>25-31 August 2025</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#666' }}>WINNERS</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Previous contests</div>
          </div>
        </div>
        
        <div style={{
          fontSize: '14px',
          color: '#999',
          textAlign: 'center'
        }}>
          Simple version - clicks: {testCount}
        </div>
      </div>
    </div>
  );
};

export default IndexSimple;