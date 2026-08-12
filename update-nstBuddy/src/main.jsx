import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log(
  '%cnstBuddy%c\nBuilt by Narendra Singh\nhttps://linkedin.com/in/codernsingh',
  'font-size: 20px; font-weight: 800; color: #0057c1;',
  'font-size: 12px; color: #727786;'
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
