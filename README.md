# D&D Table - Self-Hosted Session Web App

A private, self-hosted web application for casual D&D sessions with friends. Features a shared game board with real-time synchronization, drawing tools, tokens, and browser-local character sheets.

## Features

- **Shared Game Board**: HTML canvas with drawing support (pen, eraser, clear)
- **Grid System**: Configurable square grid with toggle
- **Background Images**: Upload and display map images (JPG/PNG)
- **Tokens**: Create, drag, and move tokens that snap to grid
- **Real-Time Sync**: WebSocket-based synchronization for all board state
- **Character Sheets**: Browser-local storage (IndexedDB) for private character sheets
- **Password Protection**: Simple shared password authentication
- **iPad Optimized**: Works great with Apple Pencil and touch input

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Network Access (Sharing with Friends)

To allow others on your local network to access the app:

1. **Start the server** - When you run `npm start`, the server will display your network IP address in the console output.

2. **Share the network address** - Share the network URL (e.g., `http://192.168.1.100:3000`) with your friends. They can access it from any device on the same network.

3. **Firewall Configuration** (if needed):
   - **Windows**: You may need to allow Node.js through Windows Firewall
     - Go to Windows Security → Firewall & network protection
     - Click "Allow an app through firewall"
     - Find Node.js and allow it for Private networks
   - **Mac**: System Settings → Network → Firewall → Options → Allow incoming connections for Node
   - **Linux**: Configure your firewall to allow port 3000 (e.g., `sudo ufw allow 3000`)

4. **Important Notes**:
   - All players must be on the same local network (same Wi-Fi/router)
   - The server must remain running on your computer
   - If your IP address changes, you'll need to share the new address
   - For internet access (not just local network), you'll need port forwarding or a service like ngrok

## Default Password

The default password is `password`. To change it, set the `PASSWORD_HASH` environment variable with a bcrypt hash of your desired password.

## Usage

1. **Login**: Enter the shared password to access the app
2. **Drawing**: Use the pen tool to draw on the board, eraser to remove, or clear button to clear all
3. **Grid**: Adjust grid size and toggle visibility
4. **Background**: Upload a map image as the background
5. **Tokens**: Click "Add Token" then click on the board to place a token. Drag tokens to move them
6. **Character Sheets**: Click the character sheet button to upload and view private character sheets (stored only in your browser)

## Technical Details

- **Frontend**: Vanilla JavaScript, HTML5 Canvas
- **Backend**: Node.js with Express and WebSocket (ws)
- **Storage**: In-memory for board state, IndexedDB for character sheets
- **Authentication**: Simple session-based password protection

## Requirements

- Node.js 14+ 
- Modern browser with WebSocket and IndexedDB support

## Notes

- The app is designed for trusted groups - no user accounts or permissions
- All board state is synchronized in real-time via WebSocket
- Character sheets are completely private and stored only in the browser
- Board state is stored in-memory and will reset when the server restarts

