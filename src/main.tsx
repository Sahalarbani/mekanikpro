/**
 * Version: 1.0.0
 * Changelog: Setup entry point React dengan StrictMode untuk keamanan rendering.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
