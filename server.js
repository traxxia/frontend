const express = require('express');
const path = require('path');
const app = express();

// For development, serve from the public directory
if (process.env.NODE_ENV === 'development') { 
  app.get('*', (req, res) => {
    res.send('Development mode: Please use "npm run dev" instead for local development');
  });
} else { 
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => { 
});