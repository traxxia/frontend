import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import reportWebVitals from './utils/reportWebVitals';
import './styles/variables.css';
import './styles/menubar.css';
import './styles/dashboard.css';
import { ThemeProvider } from './components/ThemeComponent';

// Create the root once
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// Optional: report web vitals (for performance tracking)
reportWebVitals();
