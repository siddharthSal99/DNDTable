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
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null;
const GENERAL_PASSWORD_HASH = process.env.GENERAL_PASSWORD_HASH || null;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dnd-session-secret-change-me';

// Trust proxy (required for ngrok and other reverse proxies)
app.set('trust proxy', true);

// Middleware
app.use(express.json());
app.use(cookieParser());
// Note: Static files are served AFTER routes to ensure authentication runs first

// Simple session storage (in-memory) - stores sessionId -> role mapping
const sessions = new Map(); // sessionId -> { role: 'admin' | 'general' }

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
  
  let role = null;
  
  // Check admin password
  if (ADMIN_PASSWORD_HASH) {
    const isAdmin = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (isAdmin) {
      role = 'admin';
    }
  } else {
    // Default admin password for development
    if (password === 'admin') {
      role = 'admin';
    }
  }
  
  // Check general password (only if not already admin)
  if (!role) {
    if (GENERAL_PASSWORD_HASH) {
      const isGeneral = await bcrypt.compare(password, GENERAL_PASSWORD_HASH);
      if (isGeneral) {
        role = 'general';
      }
    } else {
      // Default general password for development
      if (password === 'password') {
        role = 'general';
      }
    }
  }
  
  if (role) {
    const sessionId = Math.random().toString(36).substring(7);
    sessions.set(sessionId, { role });
    res.cookie('session', sessionId, { 
      httpOnly: true, 
      maxAge: 86400000, // 24 hours
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // Secure cookies over HTTPS
      sameSite: 'lax'
    });
    res.json({ success: true, role });
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
// Map to store WebSocket -> sessionId mapping
const wsSessions = new Map();

wss.on('connection', (ws, req) => {
  console.log('Client connected');
  
  // Extract session cookie from request headers
  const cookies = req.headers.cookie;
  let sessionId = null;
  let userRole = null;
  
  if (cookies) {
    const sessionMatch = cookies.match(/session=([^;]+)/);
    if (sessionMatch) {
      sessionId = sessionMatch[1];
      const session = sessions.get(sessionId);
      if (session) {
        userRole = session.role;
        wsSessions.set(ws, sessionId);
      }
    }
  }
  
  // Send current board state and user role to new client
  ws.send(JSON.stringify({ type: 'state', data: boardState, role: userRole }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Get user role from WebSocket session
      const wsSessionId = wsSessions.get(ws);
      const session = wsSessionId ? sessions.get(wsSessionId) : null;
      const role = session ? session.role : null;
      
      switch (data.type) {
        case 'draw':
          // General and admin can draw
          if (role === 'general' || role === 'admin') {
            boardState.drawings.push(data.path);
            broadcast(ws, { type: 'draw', path: data.path });
          }
          break;
          
        case 'clear':
          // General and admin can clear
          if (role === 'general' || role === 'admin') {
            boardState.drawings = [];
            broadcast(ws, { type: 'clear' });
          }
          break;
          
        case 'token-create':
          // General and admin can create tokens
          if (role === 'general' || role === 'admin') {
            const newToken = data.token;
            if (!boardState.tokens.find(t => t.id === newToken.id)) {
              boardState.tokens.push(newToken);
            }
            broadcast(ws, { type: 'token-create', token: newToken });
          }
          break;
          
        case 'token-move':
          // General and admin can move tokens
          if (role === 'general' || role === 'admin') {
            const token = boardState.tokens.find(t => t.id === data.id);
            if (token) {
              token.x = data.x;
              token.y = data.y;
              broadcast(ws, { type: 'token-move', id: data.id, x: data.x, y: data.y });
            }
          }
          break;
          
        case 'token-delete':
          // General and admin can delete tokens
          if (role === 'general' || role === 'admin') {
            boardState.tokens = boardState.tokens.filter(t => t.id !== data.id);
            broadcast(ws, { type: 'token-delete', id: data.id });
          }
          break;
          
        case 'background':
          // Only admin can change background
          if (role === 'admin') {
            boardState.backgroundImage = data.imageData;
            broadcast(ws, { type: 'background', imageData: data.imageData });
          }
          break;
          
        case 'grid-size':
          // Only admin can change grid size
          if (role === 'admin') {
            boardState.gridSize = data.size;
            broadcast(ws, { type: 'grid-size', size: data.size });
          }
          break;
          
        case 'grid-toggle':
          // Only admin can toggle grid
          if (role === 'admin') {
            boardState.gridVisible = data.visible;
            broadcast(ws, { type: 'grid-toggle', visible: data.visible });
          }
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    wsSessions.delete(ws);
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
  console.log(`Default admin password: admin`);
  console.log(`Default general password: password`);
  console.log(`Share this address with your friends: http://${localIP}:${PORT}`);
  console.log('Set ADMIN_PASSWORD_HASH and GENERAL_PASSWORD_HASH environment variables for custom passwords');
});

