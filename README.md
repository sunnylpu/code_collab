# 🚀 CodeCollab — Real-Time Collaborative Code Editor

> A production-ready, Google Docs + VS Code style collaborative code editor.  
> Built with **React + Vite + Monaco + Yjs + Socket.io + Node.js + MongoDB**.

---

## ✨ Features

| Feature | Detail |
|---|---|
| 🔄 Real-time collaboration | Yjs CRDT — zero merge conflicts |
| 🖱️ Live cursors | See every user's cursor position |
| 👥 Presence | Online users list with avatars |
| 💾 Persistence | Auto-saves to MongoDB every 5s |
| 🏠 Room system | Share a URL to invite collaborators |
| 💬 Chat | In-editor chat panel |
| ▶️ Code execution | Run code via Judge0 API |
| 🌗 Theme | Dark / Light toggle |
| 🔐 Auth | JWT register + login |
| 📜 History | Last 10 version snapshots |
| 🌐 Multi-language | JS, TS, Python, C++, Java, Go, Rust, HTML |

---

## 🗂️ Project Structure

```
basic_project/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express + Socket.io entry
│   │   ├── socket/
│   │   │   └── index.js           # Yjs CRDT sync engine
│   │   ├── models/
│   │   │   ├── Room.js            # Document schema
│   │   │   └── User.js            # User schema
│   │   ├── controllers/
│   │   │   ├── roomController.js  # Room CRUD
│   │   │   └── authController.js  # Register/login
│   │   ├── routes/
│   │   │   ├── rooms.js
│   │   │   └── auth.js
│   │   └── middleware/
│   │       └── auth.js            # JWT middleware
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                # Router
    │   ├── index.css              # Tailwind + global styles
    │   ├── editor/
    │   │   └── CollaborativeEditor.jsx  # Monaco + Yjs binding
    │   ├── pages/
    │   │   ├── Home.jsx           # Dashboard
    │   │   ├── EditorPage.jsx     # Main editor
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx        # Users / Settings / History
    │   │   ├── Chat.jsx           # In-editor chat
    │   │   └── OutputPanel.jsx    # Code execution
    │   ├── hooks/
    │   │   ├── useYjs.js          # Yjs + Socket.io hook
    │   │   └── useAuth.jsx        # JWT auth context
    │   └── utils/
    │       ├── api.js             # REST client
    │       └── colors.js          # User color utilities
    ├── .env.example
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## ⚡ Quick Start (Local)

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** (local or Atlas)

### 1. Clone & Install

```bash
# Clone the repo
git clone <your-repo-url>
cd basic_project

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# VITE_BACKEND_URL=http://localhost:5000 is already set
```

### 3. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open **http://localhost:5173** in two browser tabs to test real-time collaboration.

> **Tip:** Open the same room URL in two different browsers (or Incognito mode) to see live cursors.

---

## 🔌 Data Flow

```
User types
   ↓
Monaco Editor onChange
   ↓
Yjs Y.Doc.transact (local update)
   ↓
useYjs hook — doc "update" event
   ↓
socket.emit("doc-update", update)
   ↓
Backend: Y.applyUpdate(serverYdoc)
   ↓
socket.to(room).emit("doc-update", update)
   ↓
Other clients: Y.applyUpdate(localYdoc)
   ↓
Monaco editor updated via yText.observe
```

---

## 🌐 REST API Reference

### Auth
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/api/auth/register` | No | `{ username, email, password }` |
| POST | `/api/auth/login` | No | `{ email, password }` |
| GET | `/api/auth/me` | Bearer JWT | — |

### Rooms
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/rooms` | No | List public rooms |
| GET | `/api/rooms/:id` | No | Get room (auto-creates if new) |
| POST | `/api/rooms` | JWT | Create room |
| PATCH | `/api/rooms/:id` | JWT | Update room name/language |
| DELETE | `/api/rooms/:id` | JWT | Delete room |
| GET | `/api/rooms/:id/versions` | No | Get version history |

### WebSocket Events
| Client → Server | Payload |
|---|---|
| `join-room` | `{ roomId, user: { name, color } }` |
| `doc-update` | `{ roomId, update: number[] }` |
| `awareness-update` | `{ roomId, state: { cursor, selection } }` |
| `chat-message` | `{ roomId, message }` |

| Server → Client | Payload |
|---|---|
| `sync-state` | `{ update }` — full initial state |
| `doc-update` | `{ update }` — incremental delta |
| `presence-update` | `{ users[] }` |
| `awareness-update` | `{ socketId, state, allStates }` |
| `chat-message` | `{ id, sender, color, text, ts }` |

---

## 🚀 Deployment

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Set build command: `npm run build`
4. Set output dir: `dist`
5. Add env var: `VITE_BACKEND_URL=https://your-backend.onrender.com`

### Backend → Render

1. Create a **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo — root dir: `backend/`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add env vars from `.env.example`

### Database → MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Allow network access (0.0.0.0/0 for Render)
4. Copy the connection string → `MONGODB_URI` in Render env vars

---

## 🔑 Environment Variables

### Backend `.env`
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=change_this_to_random_32_char_string
CLIENT_URL=https://your-frontend.vercel.app
PERSIST_INTERVAL_MS=5000
```

### Frontend `.env`
```env
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_JUDGE0_API_KEY=your_rapidapi_key   # optional
```

---

## 🧠 Architecture Notes

### Why Yjs CRDT?
Traditional WebSocket broadcasting (last-write-wins) loses edits when two users type simultaneously. Yjs uses a Conflict-free Replicated Data Type (CRDT) — every edit is represented as a composable operation that can be applied in any order and always converges to the same result.

### Why custom Socket.io sync (not y-socket.io)?
The `y-socket.io` npm package (client) is ESM-only and requires complex Vite bundler configuration. We implemented the same protocol manually in `useYjs.js` — it's only ~60 lines and gives full control.

### Scalability
- For multiple backend instances, replace the in-memory `rooms` Map in `socket/index.js` with Redis using `ioredis` + `socket.io-redis` adapter.
- MongoDB change streams can be used for cross-instance awareness broadcasting.

---

## 🛠️ Code Execution (Judge0)

1. Sign up at [rapidapi.com](https://rapidapi.com/judge0-official/api/judge0-ce)
2. Subscribe to the free plan
3. Copy your API key → `VITE_JUDGE0_API_KEY` in `frontend/.env`

Without a key, the Run button shows a demo message (no crash).

---

## 📝 License

MIT — free to use for hackathons, portfolios, and production.
