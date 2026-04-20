import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'; // Inicialización única de i18n
import { seedKnowledgeBase } from './seedKB';

// Asegurar base de conocimiento inicial en Firestore
seedKnowledgeBase();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
