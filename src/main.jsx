import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { HoneynetProvider } from './context/HoneynetContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <HoneynetProvider>
        <App />
      </HoneynetProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
