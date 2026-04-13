import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './utils/reportWebVitals';

// Create the root once
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: report web vitals (for performance tracking)
reportWebVitals();
