import React from 'react'
import ReactDOM from 'react-dom/client'

const SimpleApp = () => {
  return React.createElement('div', {
    style: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }
  }, [
    React.createElement('h1', { key: '1' }, 'Mobile Test'),
    React.createElement('p', { key: '2' }, 'React is working!'),
    React.createElement('button', {
      key: '3',
      onClick: () => alert('Success!'),
      style: {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px'
      }
    }, 'Click Me')
  ])
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(React.createElement(SimpleApp))