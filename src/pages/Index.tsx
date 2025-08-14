const Index = () => {
  console.log('[INDEX] Ultra simple Index rendering');
  
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
          Mobile testing - no frameworks
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
            alert('Success! React works on mobile');
            console.log('[MOBILE] Button clicked successfully');
          }}
        >
          Test Mobile Button
        </button>
        
        <div style={{
          marginTop: '16px',
          fontSize: '12px',
          color: '#999',
          textAlign: 'center'
        }}>
          Version: Pure inline styles
        </div>
      </div>
    </div>
  );
};

export default Index;
