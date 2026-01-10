// Canvas setup
const canvas = document.getElementById('board-canvas');
const ctx = canvas.getContext('2d');

// Board state (must be declared before functions that use it)
let boardState = {
    tokens: [],
    backgroundImage: null,
    gridSize: 50,
    gridVisible: true,
    drawings: []
};

// Drawing state
let isDrawing = false;
let currentTool = 'pen';
let drawColor = '#000000';
let lastX = 0;
let lastY = 0;
let currentPath = [];

// Set canvas size
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    redraw();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// WebSocket connection
let ws;
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        setTimeout(connectWebSocket, 1000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}
connectWebSocket();

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'state':
            boardState = data.data;
            redraw();
            renderTokens();
            break;
            
        case 'draw':
            boardState.drawings.push(data.path);
            drawPath(data.path);
            break;
            
        case 'clear':
            boardState.drawings = [];
            redraw();
            renderTokens();
            break;
            
        case 'token-create':
            // Check if token already exists (avoid duplicates)
            if (!boardState.tokens.find(t => t.id === data.token.id)) {
                boardState.tokens.push(data.token);
                createTokenElement(data.token);
            }
            break;
            
        case 'token-move':
            const token = boardState.tokens.find(t => t.id === data.id);
            if (token) {
                token.x = data.x;
                token.y = data.y;
                updateTokenPosition(data.id, data.x, data.y);
            }
            break;
            
        case 'token-delete':
            boardState.tokens = boardState.tokens.filter(t => t.id !== data.id);
            document.getElementById(`token-${data.id}`)?.remove();
            break;
            
        case 'background':
            boardState.backgroundImage = data.imageData;
            redraw();
            renderTokens();
            break;
            
        case 'grid-size':
            boardState.gridSize = data.size;
            redraw();
            updateTokenSizes();
            break;
            
        case 'grid-toggle':
            boardState.gridVisible = data.visible;
            redraw();
            renderTokens();
            break;
    }
}

// Drawing functions
function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function startDrawing(e) {
    if (currentTool === 'pen' || currentTool === 'eraser') {
        isDrawing = true;
        const pos = getEventPos(e);
        lastX = pos.x;
        lastY = pos.y;
        currentPath = {
            tool: currentTool,
            color: drawColor,
            points: [{ x: lastX, y: lastY }]
        };
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getEventPos(e);
    currentPath.points.push({ x: pos.x, y: pos.y });
    
    // Draw locally
    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineWidth = currentTool === 'eraser' ? 20 : 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentTool === 'eraser' ? 'rgba(0,0,0,1)' : drawColor;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing(e) {
    if (isDrawing && currentPath && currentPath.points.length > 0) {
        // Send drawing to server
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'draw', path: currentPath }));
        }
        boardState.drawings.push(currentPath);
        currentPath = null;
    }
    isDrawing = false;
}

// Canvas event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
});
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDrawing(e);
});

// Tool buttons
document.getElementById('pen-tool').addEventListener('click', () => {
    currentTool = 'pen';
    document.getElementById('pen-tool').classList.add('active');
    document.getElementById('eraser-tool').classList.remove('active');
});

document.getElementById('eraser-tool').addEventListener('click', () => {
    currentTool = 'eraser';
    document.getElementById('eraser-tool').classList.add('active');
    document.getElementById('pen-tool').classList.remove('active');
});

document.getElementById('draw-color').addEventListener('change', (e) => {
    drawColor = e.target.value;
});

document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Clear all drawings?')) {
        boardState.drawings = [];
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'clear' }));
        }
        redraw();
        renderTokens();
    }
});

// Grid controls
document.getElementById('grid-size').addEventListener('change', (e) => {
    const size = parseInt(e.target.value);
    boardState.gridSize = size;
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'grid-size', size }));
    }
    redraw();
    updateTokenSizes();
});

document.getElementById('grid-toggle').addEventListener('click', () => {
    boardState.gridVisible = !boardState.gridVisible;
    const btn = document.getElementById('grid-toggle');
    btn.classList.toggle('active', boardState.gridVisible);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'grid-toggle', visible: boardState.gridVisible }));
    }
    redraw();
    renderTokens();
});

// Background image
document.getElementById('background-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            boardState.backgroundImage = imageData;
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'background', imageData }));
            }
            redraw();
            renderTokens();
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('clear-background').addEventListener('click', () => {
    boardState.backgroundImage = null;
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'background', imageData: null }));
    }
    redraw();
    renderTokens();
});

// Token system
document.getElementById('add-token-btn').addEventListener('click', () => {
    // Open modal immediately
    document.getElementById('token-modal').classList.remove('hidden');
    // Reset form
    document.getElementById('token-name').value = 'Token';
    document.getElementById('token-color').value = '#3498db';
});

document.getElementById('token-create-btn').addEventListener('click', () => {
    const name = document.getElementById('token-name').value || 'Token';
    const color = document.getElementById('token-color').value;
    
    // Place token at center of canvas
    let x = canvas.width / 2;
    let y = canvas.height / 2;
    
    // Snap to grid center if enabled (grid squares are centered at gridSize intervals)
    if (boardState.gridVisible) {
        x = Math.round(x / boardState.gridSize) * boardState.gridSize;
        y = Math.round(y / boardState.gridSize) * boardState.gridSize;
    }
    
    const token = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        x: x,
        y: y,
        name: name,
        color: color
    };
    
    boardState.tokens.push(token);
    createTokenElement(token);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'token-create', token }));
    }
    
    document.getElementById('token-modal').classList.add('hidden');
});

document.getElementById('token-cancel-btn').addEventListener('click', () => {
    document.getElementById('token-modal').classList.add('hidden');
});

function getTokenSize() {
    // Token size is 80% of grid size, with a minimum of 30px
    return Math.max(30, Math.round(boardState.gridSize * 0.8));
}

function createTokenElement(token) {
    const tokenSize = getTokenSize();
    const tokenEl = document.createElement('div');
    tokenEl.id = `token-${token.id}`;
    tokenEl.className = 'token';
    
    // Center token on grid square (token.x and token.y are grid square centers)
    tokenEl.style.left = (token.x - tokenSize / 2) + 'px';
    tokenEl.style.top = (token.y - tokenSize / 2) + 'px';
    
    const circle = document.createElement('div');
    circle.className = 'token-circle';
    circle.style.width = tokenSize + 'px';
    circle.style.height = tokenSize + 'px';
    circle.style.fontSize = (tokenSize * 0.4) + 'px';
    circle.style.backgroundColor = token.color;
    circle.textContent = token.name.charAt(0).toUpperCase();
    
    const label = document.createElement('div');
    label.className = 'token-label';
    label.textContent = token.name;
    label.style.fontSize = (tokenSize * 0.2) + 'px';
    label.style.top = (-tokenSize * 0.6) + 'px';
    
    tokenEl.appendChild(circle);
    tokenEl.appendChild(label);
    
    // Make draggable
    makeTokenDraggable(tokenEl, token);
    
    document.querySelector('.board-container').appendChild(tokenEl);
}

function updateTokenSizes() {
    const tokenSize = getTokenSize();
    document.querySelectorAll('.token').forEach(tokenEl => {
        const circle = tokenEl.querySelector('.token-circle');
        const label = tokenEl.querySelector('.token-label');
        const tokenId = tokenEl.id.replace('token-', '');
        const token = boardState.tokens.find(t => t.id === tokenId);
        
        if (token && circle) {
            // Update size
            circle.style.width = tokenSize + 'px';
            circle.style.height = tokenSize + 'px';
            circle.style.fontSize = (tokenSize * 0.4) + 'px';
            
            // Update label
            if (label) {
                label.style.fontSize = (tokenSize * 0.2) + 'px';
                label.style.top = (-tokenSize * 0.6) + 'px';
            }
            
            // Re-center token on grid square
            tokenEl.style.left = (token.x - tokenSize / 2) + 'px';
            tokenEl.style.top = (token.y - tokenSize / 2) + 'px';
        }
    });
}

function makeTokenDraggable(element, token) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    
    const startDrag = (e) => {
        isDragging = true;
        const tokenSize = getTokenSize();
        const rect = element.getBoundingClientRect();
        const boardRect = canvas.getBoundingClientRect();
        // Calculate offset from center of token
        if (e.touches) {
            offsetX = e.touches[0].clientX - (rect.left + tokenSize / 2) - boardRect.left;
            offsetY = e.touches[0].clientY - (rect.top + tokenSize / 2) - boardRect.top;
        } else {
            offsetX = e.clientX - (rect.left + tokenSize / 2) - boardRect.left;
            offsetY = e.clientY - (rect.top + tokenSize / 2) - boardRect.top;
        }
    };
    
    const drag = (e) => {
        if (!isDragging) return;
        const tokenSize = getTokenSize();
        const boardRect = canvas.getBoundingClientRect();
        let x, y;
        // Calculate position based on center of token
        if (e.touches) {
            x = e.touches[0].clientX - boardRect.left - offsetX;
            y = e.touches[0].clientY - boardRect.top - offsetY;
        } else {
            x = e.clientX - boardRect.left - offsetX;
            y = e.clientY - boardRect.top - offsetY;
        }
        
        // Snap to grid center if enabled
        if (boardState.gridVisible) {
            // Snap to grid center
            x = Math.round(x / boardState.gridSize) * boardState.gridSize;
            y = Math.round(y / boardState.gridSize) * boardState.gridSize;
        }
        
        // Position element so token center aligns with grid center
        element.style.left = (x - tokenSize / 2) + 'px';
        element.style.top = (y - tokenSize / 2) + 'px';
        
        // Store grid center position in token
        token.x = x;
        token.y = y;
        
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'token-move', id: token.id, x, y }));
        }
    };
    
    const stopDrag = () => {
        isDragging = false;
    };
    
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('touchstart', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
}

function updateTokenPosition(id, x, y) {
    const tokenEl = document.getElementById(`token-${id}`);
    if (tokenEl) {
        const tokenSize = getTokenSize();
        // Center token on grid square
        tokenEl.style.left = (x - tokenSize / 2) + 'px';
        tokenEl.style.top = (y - tokenSize / 2) + 'px';
    }
}

function renderTokens() {
    // Remove all existing tokens
    document.querySelectorAll('.token').forEach(el => el.remove());
    
    // Recreate all tokens
    boardState.tokens.forEach(token => {
        createTokenElement(token);
    });
}

// Drawing rendering
function drawPath(path) {
    // Handle both old format (array of points) and new format (object with points array)
    let points, tool, color;
    if (Array.isArray(path)) {
        // Legacy format - convert to new format
        points = path;
        tool = path[0]?.tool || 'pen';
        color = '#000000';
    } else {
        // New format
        points = path.points || [];
        tool = path.tool || 'pen';
        color = path.color || '#000000';
    }
    
    if (points.length < 2) return;
    
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineWidth = tool === 'eraser' ? 20 : 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image
    if (boardState.backgroundImage) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            drawGrid();
            boardState.drawings.forEach(path => drawPath(path));
        };
        img.src = boardState.backgroundImage;
    } else {
        drawGrid();
        boardState.drawings.forEach(path => drawPath(path));
    }
}

function drawGrid() {
    if (!boardState.gridVisible) return;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvas.width; x += boardState.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += boardState.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Character Sheet functionality
const DB_NAME = 'dnd-character-sheets';
const DB_VERSION = 1;
let db = null;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('sheets')) {
                db.createObjectStore('sheets', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function loadSheets() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sheets'], 'readonly');
        const store = transaction.objectStore('sheets');
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function saveSheet(name, file) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const sheet = {
                name: name,
                type: file.type,
                data: event.target.result,
                timestamp: Date.now()
            };
            
            const transaction = db.transaction(['sheets'], 'readwrite');
            const store = transaction.objectStore('sheets');
            const request = store.add(sheet);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        };
        reader.readAsDataURL(file);
    });
}

async function deleteSheet(id) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sheets'], 'readwrite');
        const store = transaction.objectStore('sheets');
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function displaySheets() {
    const sheets = await loadSheets();
    const listEl = document.getElementById('sheets-list');
    listEl.innerHTML = '';
    
    sheets.forEach(sheet => {
        const item = document.createElement('div');
        item.className = 'sheet-item';
        
        const header = document.createElement('div');
        header.className = 'sheet-item-header';
        
        const name = document.createElement('div');
        name.className = 'sheet-item-name';
        name.textContent = sheet.name;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'sheet-delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = async () => {
            await deleteSheet(sheet.id);
            displaySheets();
        };
        
        header.appendChild(name);
        header.appendChild(deleteBtn);
        
        const viewer = document.createElement('div');
        viewer.className = 'sheet-viewer';
        
        if (sheet.type === 'application/pdf') {
            const iframe = document.createElement('iframe');
            iframe.src = sheet.data;
            viewer.appendChild(iframe);
        } else {
            const img = document.createElement('img');
            img.src = sheet.data;
            viewer.appendChild(img);
        }
        
        item.appendChild(header);
        item.appendChild(viewer);
        listEl.appendChild(item);
    });
}

document.getElementById('character-sheet-toggle').addEventListener('click', () => {
    const panel = document.getElementById('character-sheet-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        displaySheets();
    }
});

document.getElementById('close-sheet-panel').addEventListener('click', () => {
    document.getElementById('character-sheet-panel').classList.add('hidden');
});

document.getElementById('sheet-upload').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
        const name = file.name;
        await saveSheet(name, file);
    }
    displaySheets();
    e.target.value = ''; // Reset input
});

// Initialize
initDB().then(() => {
    console.log('IndexedDB initialized');
});

