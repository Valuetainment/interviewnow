// Super simple Express server for testing Fly.io deployment
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Basic routes
app.get('/', (req, res) => {
  res.send('Interview Hybrid SDP Proxy Server is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
}); 