import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// Import Firebase to ensure it's initialized early
import './firebase';

console.log('🚀 Starting React application with Firebase...');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 