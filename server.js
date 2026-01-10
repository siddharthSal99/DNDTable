const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = process.env.PORT || 3000;
const PASSWORD_HASH = process.env.PASSWORD_HASH || null; // Set via environment variable, or use default "password"
const SESSION_SECRET = process.env.SESSION_SECRET || 'dnd-session-secret-change-me';

// Middleware
app.use(express.json());
app.use(cookieParser());
// Note: Static files are served AFTER routes to ensure authentication runs first

// Simple session storage (in-memory)
const sessions = new Set();

// Password protection middleware
function requireAuth(req, res, next) {
  const sessionId = req.cookies.session;
  if (sessionId && sessions.has(sessionId)) {
    return next();
  }
  res.redirect('/login');
}

// Login page (no auth required)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login handler
app.post('/login', async (req, res) => {
  const { password } = req.body;
  
  // Default password is "password" if PASSWORD_HASH is not set
  let isValid = false;
  if (PASSWORD_HASH) {
    isValid = await bcrypt.compare(password, PASSWORD_HASH);
  } else {
    // Default password for development
    isValid = password === 'password';
  }
  
  if (isValid) {
    const sessionId = Math.random().toString(36).substring(7);
    sessions.add(sessionId);
    res.cookie('session', sessionId, { httpOnly: true, maxAge: 86400000 }); // 24 hours
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// Main app route (PROTECTED - must be before static middleware)
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static files (CSS, JS, etc.) - but index.html is already handled by route above
app.use(express.static('public', {
  index: false // Don't automatically serve index.html for directory requests
}));

// In-memory board state
let boardState = {
  tokens: [],
  backgroundImage: null,
  gridSize: 50,
  gridVisible: true,
  drawings: [] // Array of drawing paths
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send current board state to new client
  ws.send(JSON.stringify({ type: 'state', data: boardState }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'draw':
          // Add drawing path
          boardState.drawings.push(data.path);
          // Broadcast to all other clients
          broadcast(ws, { type: 'draw', path: data.path });
          break;
          
        case 'clear':
          boardState.drawings = [];
          broadcast(ws, { type: 'clear' });
          break;
          
        case 'token-create':
          // Use the token sent by the client
          const newToken = data.token;
          // Check if token already exists (avoid duplicates)
          if (!boardState.tokens.find(t => t.id === newToken.id)) {
            boardState.tokens.push(newToken);
          }
          // Broadcast to all other clients (not the sender)
          broadcast(ws, { type: 'token-create', token: newToken });
          break;
          
        case 'token-move':
          const token = boardState.tokens.find(t => t.id === data.id);
          if (token) {
            token.x = data.x;
            token.y = data.y;
            broadcast(ws, { type: 'token-move', id: data.id, x: data.x, y: data.y });
          }
          break;
          
        case 'token-delete':
          boardState.tokens = boardState.tokens.filter(t => t.id !== data.id);
          broadcast(ws, { type: 'token-delete', id: data.id });
          break;
          
        case 'background':
          boardState.backgroundImage = data.imageData;
          broadcast(ws, { type: 'background', imageData: data.imageData });
          break;
          
        case 'grid-size':
          boardState.gridSize = data.size;
          broadcast(ws, { type: 'grid-size', size: data.size });
          break;
          
        case 'grid-toggle':
          boardState.gridVisible = data.visible;
          broadcast(ws, { type: 'grid-toggle', visible: data.visible });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function broadcast(sender, data) {
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

server.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // Find the first non-internal IPv4 address
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        localIP = addr.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  console.log(`D&D Table server running!`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://${localIP}:${PORT}`);
  console.log(`Default password: password`);
  console.log(`Share this address with your friends: http://${localIP}:${PORT}`);
  console.log('Change PASSWORD_HASH environment variable to set a custom password');
});

