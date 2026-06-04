import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { iniciarAccesibilidad } from './lib/accesibilidad'

// Aplica preferencias de accesibilidad guardadas antes del primer render
iniciarAccesibilidad()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
