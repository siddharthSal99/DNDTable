# D&D Session Web App — Requirements

## 1. Project Goal

Build a *private, self-hosted web application* for casual D&D sessions with friends.

The app is *not a product*, has *no user accounts*, and assumes a *trusted group*.  
All gameplay interactions are shared and collaborative.  
Character sheets are *browser-local and private*.

Primary target device: *iPad (Safari) with Apple Pencil*  
Secondary: Desktop browsers (Chrome, Firefox, Safari)

---

## 2. Non-Goals (Explicitly Out of Scope)

The following features must NOT be implemented:

- User accounts or per-player logins
- Player permissions or ownership
- Fog of war or vision cones
- Rules automation (initiative, stats, dice logic, etc.)
- Editable character sheets
- Chat, voice, or video
- Mobile app (web only)

---

## 3. Security Requirements

### 3.1 Access Control
- The site must be protected by a *single shared password*.
- No individual user accounts.
- Password may be:
  - HTTP Basic Auth, OR
  - Simple login page that sets a session cookie.

### 3.2 Hosting Assumptions
- App will be self-hosted on the DM’s computer.
- Accessed via IP address by friends.
- HTTPS is preferred but not required for v1.

---

## 4. Core Application Features

### 4.1 Shared Game Board

#### Canvas
- Implement the board using **HTML <canvas>**.
- Must support:
  - Apple Pencil drawing
  - Touch input
  - Mouse input
- Drawing latency should be low enough for live use.

#### Drawing Tools
- Single pen tool
- Single eraser tool
- Clear drawing layer button
- No layers, colors, or brush styles required for v1

---

### 4.2 Grid System

- Display a square grid over the board.
- Grid size (square dimensions) must be configurable.
- Grid can be toggled on/off.
- Grid aligns consistently with tokens and drawing.

---

### 4.3 Background Image

- DM can upload a background image for the map.
- Supported formats: JPG, PNG.
- Background image:
  - Is drawn beneath grid and drawing layers
  - Can be replaced or cleared
- No image editing tools required.

---

### 4.4 Tokens (Player Pieces)

- Tokens represent characters or NPCs.
- All players can:
  - Create tokens
  - Move any token
- Tokens:
  - Are draggable
  - Snap to grid (optional but preferred)
  - Have a name label
  - Have a simple visual (circle or image)

No ownership, permissions, or visibility restrictions.

---

### 4.5 Real-Time Sync

- Board state is synchronized for all connected players:
  - Token positions
  - Drawings
  - Background image
- Use WebSockets or equivalent.
- Eventual consistency is acceptable (no strict locking).

---

## 5. Character Sheets (Browser-Local Only)

### 5.1 Scope
- Character sheets are *not shared*.
- Character sheets are *not stored on the server*.
- Character sheets are *only visible to the browser that uploads them*.

### 5.2 Upload
- Each player can upload:
  - PDF
  - Image (PNG/JPG)
- Upload is handled via <input type="file">.

### 5.3 Storage
- Files remain in browser memory only, OR
- Optionally persisted using:
  - IndexedDB (preferred)
  - localStorage (only for small files)

### 5.4 Viewing
- Sheets are viewable in:
  - A side panel, OR
  - A modal, OR
  - A separate tab/iframe
- No editing functionality.
- No sharing functionality.

---

## 6. UI / UX Requirements

- Must work well on iPad Safari:
  - Touch gestures
  - Apple Pencil drawing
- Layout should prioritize the board.
- Character sheet UI must not interfere with drawing.
- Minimal UI; no complex menus.

---

## 7. Technical Constraints

### 7.1 Frontend
- Vanilla JS, or a lightweight framework (React/Vue acceptable).
- Use <canvas> for the board.
- No heavy UI frameworks required.

### 7.2 Backend
- Minimal backend:
  - Serve static files
  - Handle WebSocket connections
- No database required for v1.
- In-memory state is acceptable.

---

## 8. Persistence (Optional, Nice-to-Have)

If implemented:
- Board state may be saved/restored.
- Persistence is optional and not required for v1.

---

## 9. Success Criteria

The project is successful if:

- Multiple players can connect via browser
- Everyone can draw and move tokens in real time
- Background maps with grids are usable
- Character sheets are private and local
- App is usable on an iPad with Apple Pencil
- Setup is simple and requires minimal configuration

---

## 10. Implementation Philosophy

- Prefer simplicity over extensibility.
- Avoid premature abstraction.
- Optimize for casual, private play.
- Do not build features “for later”.s