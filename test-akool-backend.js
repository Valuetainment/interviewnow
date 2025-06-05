const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Store these in environment variables in production
const AKOOL_CLIENT_ID = process.env.AKOOL_CLIENT_ID || 'YOUR_CLIENT_ID';
const AKOOL_CLIENT_SECRET = process.env.AKOOL_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';

// Get AKOOL token
async function getAkoolToken() {
  const response = await fetch('https://openapi.akool.com/api/open/v3/getToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: AKOOL_CLIENT_ID,
      clientSecret: AKOOL_CLIENT_SECRET
    })
  });

  const data = await response.json();
  
  if (data.code !== 1000 || !data.token) {
    throw new Error(data.message || 'Failed to get AKOOL token');
  }
  
  return data.token;
}

// Create AKOOL session
async function createAkoolSession(token, avatarId = 'dvp_Tristan_cloth2_1080P', duration = 300) {
  const response = await fetch('https://openapi.akool.com/api/open/v4/liveAvatar/session/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      avatar_id: avatarId,
      duration: duration
    })
  });

  const data = await response.json();
  
  if (!data.data) {
    throw new Error(data.message || 'Failed to create session');
  }
  
  return data.data;
}

// API endpoint to create session
app.post('/api/create-avatar-session', async (req, res) => {
  try {
    const { avatarId, duration } = req.body;
    
    // Get token
    const token = await getAkoolToken();
    
    // Create session
    const sessionData = await createAkoolSession(token, avatarId, duration);
    
    res.json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AKOOL backend server running on port ${PORT}`);
  console.log(`Make sure to set AKOOL_CLIENT_ID and AKOOL_CLIENT_SECRET environment variables`);
}); 