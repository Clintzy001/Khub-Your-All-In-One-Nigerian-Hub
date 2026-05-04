import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error("Root element not found")
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* We removed QueryClientProvider and Toaster from here 
      because they are already defined inside your App.tsx 
    */}
    <App />
  </React.StrictMode>
)
