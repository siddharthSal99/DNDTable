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

### Option 1: Docker (Recommended - Platform Independent)

**Prerequisites:**
- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) installed

**Quick Start:**

1. **Set up ngrok (REQUIRED for internet access):**
   - Sign up for a free account at [ngrok.com](https://ngrok.com) (takes 30 seconds)
   - Get your authtoken from the [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
   - Create a `.env` file in the project root:
     ```bash
     NGROK_AUTHTOKEN=your_ngrok_authtoken_here
     PASSWORD_HASH=your_password_hash_here  # Optional, but HIGHLY RECOMMENDED for internet access
     ```
   - **Note**: Without `NGROK_AUTHTOKEN`, ngrok will not work and you'll only have local network access

2. **Build and start the containers:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - **Local access**: `http://localhost:3000`
   - **Public Internet URL**: 
     - Open `http://localhost:4040` in your browser to access the ngrok web interface
     - Look for the "Forwarding" section - you'll see a public HTTPS URL like `https://abc123.ngrok-free.app`
     - **This is the URL you can share with anyone on the internet!** They don't need to be on your network.
     - Alternatively, check the logs: `docker-compose logs ngrok` to see the public URL in the console

**Docker Commands:**
- Start in background: `docker-compose up -d`
- View logs: `docker-compose logs -f`
- View ngrok logs (to see public URL): `docker-compose logs -f ngrok`
- Stop: `docker-compose down`
- Rebuild after changes: `docker-compose up --build`

**Getting Your Public Internet URL:**
Once the containers are running, ngrok creates a public **HTTPS** URL that **anyone on the internet can access**:
1. **Web Interface** (Easiest): Open `http://localhost:4040` in your browser and look for the "Forwarding" section
   - You'll see a URL like: `https://abc123.ngrok-free.app` (note the **https://** prefix)
   - **Important**: Always use the HTTPS URL, not HTTP
2. **Logs**: Run `docker-compose logs ngrok` and look for a line like `Forwarding https://xxxx.ngrok-free.app -> http://app:3000`
3. Share this **HTTPS** URL with your friends - they can access your D&D Table from anywhere in the world!

**Note**: ngrok automatically provides HTTPS encryption. The URL will always start with `https://` - make sure you're using the HTTPS URL, not trying to access via HTTP.

**⚠️ Security Warning**: Since this exposes your app to the entire internet, make sure to:
- Set a strong password using `PASSWORD_HASH` in your `.env` file
- Only share the URL with trusted friends
- Stop the containers when not in use (`docker-compose down`)

**Troubleshooting SSL Errors:**
If you see `ERR_SSL_PROTOCOL_ERROR` when accessing the ngrok URL:
1. **Verify your ngrok authtoken is set**: Check that `NGROK_AUTHTOKEN` is in your `.env` file and is valid
2. **Check ngrok logs**: Run `docker-compose logs ngrok` to see if there are any errors
3. **Wait for app to be ready**: The app container has a healthcheck - make sure it's healthy before accessing: `docker-compose ps`
4. **Restart containers**: Try `docker-compose down && docker-compose up --build`
5. **Verify the URL**: Make sure you're using the HTTPS URL from ngrok (starts with `https://`), not HTTP

**Running without ngrok (local network only):**
If you only need local network access and don't want ngrok, you can run just the app:
```bash
docker-compose -f docker-compose.no-ngrok.yml up --build
```
Or start only the app service from the main compose file:
```bash
docker-compose up app --build
```

### Option 2: Native Installation

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

### Local Network Access

To allow others on your **local network** (same Wi-Fi) to access the app:

1. **Start the server** - When you run `npm start`, the server will display your network IP address in the console output.

2. **Share the network address** - Share the network URL (e.g., `http://192.168.1.100:3000`) with your friends. They can access it from any device on the same network.

3. **Firewall Configuration** (if needed):
   - **Windows**: You may need to allow Node.js through Windows Firewall
     - Go to Windows Security → Firewall & network protection
     - Click "Allow an app through firewall"
     - Find Node.js and allow it for Private networks
   - **Mac**: System Settings → Network → Firewall → Options → Allow incoming connections for Node
   - **Linux**: Configure your firewall to allow port 3000 (e.g., `sudo ufw allow 3000`)

### Internet Access (Friends Outside Your Network)

To allow friends who are **not on your local network** to access the app, see **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed instructions.

**Quick Start Options:**
- **ngrok** (Recommended): `ngrok http 3000` - Easiest, automatic HTTPS
- **Cloudflare Tunnel**: `cloudflared tunnel --url http://localhost:3000` - Free, no account needed
- **Port Forwarding**: Advanced, requires router access

**⚠️ Security**: Before exposing your app online, make sure to set a strong password using the `PASSWORD_HASH` environment variable!

## Default Password

The default password is `password`. 

**⚠️ Important**: Before exposing your app to the internet, set a strong password!

### Setting a Custom Password

1. **Generate a password hash:**
   ```bash
   npm run generate-password
   ```
   Or run directly:
   ```bash
   node generate-password-hash.js
   ```

2. **Set the environment variable:**
   - **Docker**: Add `PASSWORD_HASH=your_hash_here` to your `.env` file
   - **Windows (PowerShell):** `$env:PASSWORD_HASH="your_hash_here"`
   - **Windows (CMD):** `set PASSWORD_HASH=your_hash_here`
   - **Mac/Linux:** `export PASSWORD_HASH="your_hash_here"`

3. **Start the server** with the environment variable set.

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

### Docker Installation
- Docker and Docker Compose
- ngrok account (for internet access via Docker setup)
- Modern browser with WebSocket and IndexedDB support

### Native Installation
- Node.js 14+ 
- Modern browser with WebSocket and IndexedDB support

## Notes

- The app is designed for trusted groups - no user accounts or permissions
- All board state is synchronized in real-time via WebSocket
- Character sheets are completely private and stored only in the browser
- Board state is stored in-memory and will reset when the server restarts

