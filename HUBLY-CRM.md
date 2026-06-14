# Hubly CRM — Complete Project Reference

> A customer support CRM with a live chat widget, ticket management, agent dashboard, analytics, and team management.  
> Use this document to understand the codebase, prepare for interviews, or onboard new developers.

---

## Table of Contents

1. [What It Does (Product Overview)](#1-what-it-does)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Data Models](#4-data-models)
5. [Backend — API Reference](#5-backend--api-reference)
6. [Real-time (Socket.io)](#6-real-time-socketio)
7. [Frontend — Pages & Components](#7-frontend--pages--components)
8. [Security Measures](#8-security-measures)
9. [Configuration (.env)](#9-configuration-env)
10. [Running the Project](#10-running-the-project)
11. [Key Design Decisions (Interview Ready)](#11-key-design-decisions)
12. [Production Checklist](#12-production-checklist)

---

## 1. What It Does

Hubly CRM has two sides:

| Side | Who Uses It | What They Can Do |
|---|---|---|
| **Customer Widget** | Website visitors | Start a chat, send messages, receive agent replies in real time |
| **Agent Dashboard** | Support team | View all tickets, reply to customers, assign tickets, resolve chats, view analytics |

**Core flow:**
1. Customer visits the landing page → opens the chat widget → fills in name/phone/email
2. A **ticket** is created in MongoDB and assigned to the admin
3. The agent sees the ticket appear in real time (Socket.io) → replies
4. Both sides see typing indicators and new messages instantly (no polling)
5. Agent marks ticket as resolved when done

---

## 2. Tech Stack

### Backend
| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js (ES modules) | Fast I/O, great for real-time |
| Framework | Express.js 4 | Lightweight, flexible routing |
| Database | MongoDB + Mongoose 8 | Schema-flexible, great for chat data |
| Real-time | Socket.io 4 | WebSocket with auto-fallback to polling |
| Auth | JWT (jsonwebtoken) | Stateless, works well with REST + sockets |
| Passwords | bcryptjs (cost 12) | Secure password hashing |
| Validation | Zod | Type-safe schema validation at the boundary |
| Rate limiting | express-rate-limit | Protection against brute force / spam |
| Security | Helmet | Sets 15+ HTTP security headers automatically |
| Logging | Winston + Morgan | Structured logs, request tracing |
| File uploads | Multer | Multipart/form-data parsing, disk storage |
| Email | Nodemailer | SMTP-based email notifications |

### Frontend
| Layer | Technology | Why |
|---|---|---|
| UI framework | React 19 | Component model, hooks |
| Build tool | Vite 7 | Fast HMR, optimised production build |
| Routing | React Router DOM 7 | Nested routes for dashboard layout |
| Real-time | socket.io-client 4 | Pairs with backend Socket.io |
| HTTP | Native Fetch + custom `api` wrapper | No extra deps, easy error handling |
| Styling | Custom CSS (BEM-like) | Zero-dependency, full control |

---

## 3. Architecture Overview

```
┌─────────────────────────────────┐
│       Customer Browser          │
│  Landing Page + Chat Widget     │
│  (MiniChat.jsx — socket client) │
└────────────┬────────────────────┘
             │ HTTPS / WSS
┌────────────▼────────────────────┐
│         Express Server          │
│  - Helmet (security headers)    │
│  - Morgan (HTTP logging)        │
│  - express-rate-limit           │
│  - Zod validation middleware    │
│  - REST routes (/api/*)         │
│  - Socket.io (ticket rooms)     │
│  - Static file serving          │
└────────────┬────────────────────┘
             │ Mongoose ODM
┌────────────▼────────────────────┐
│         MongoDB Atlas           │
│  Users · Tickets · Messages     │
│  ChatbotSettings                │
└─────────────────────────────────┘
             ▲
┌────────────┴────────────────────┐
│       Agent Browser             │
│  Dashboard (React SPA)          │
│  - ContactCenter (socket client)│
│  - Analytics, Team, Settings    │
└─────────────────────────────────┘
```

### File structure

```
Hubly-CRM/
├── backend/
│   ├── src/
│   │   ├── config/         db.js
│   │   ├── middleware/     auth.js · rateLimiter.js · validate.js · errorHandler.js
│   │   ├── models/         User.js · Ticket.js · Message.js · ChatbotSettings.js
│   │   ├── routes/         auth · users · tickets · messages · publicChat · analytics · chatbot · upload
│   │   ├── socket/         index.js   ← Socket.io init + room logic
│   │   └── utils/          logger.js · missedChat.js · email.js
│   ├── uploads/            (served as /uploads — agent-uploaded files)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── assets/         icons, images
    │   ├── components/     MiniChat.jsx · ErrorBoundary.jsx
    │   ├── hooks/          useSocket.js
    │   ├── layouts/        DashboardLayout.jsx
    │   ├── pages/          LandingPage · LoginPage · SignupPage · DashboardHome ·
    │   │                   ContactCenter · Analytics · ChatBot · TeamManagement · Setting
    │   ├── App.jsx         route definitions
    │   ├── apiClient.js    fetch wrapper + auth helpers
    │   └── main.jsx        React root with ErrorBoundary
    └── package.json
```

---

## 4. Data Models

### User
```js
{
  firstName:    String (required)
  lastName:     String (required)
  email:        String (unique, lowercase)
  phone:        String (optional)
  role:         "admin" | "member"   // first signup = admin
  passwordHash: String               // bcrypt, cost 12
  createdAt, updatedAt
}
```

### Ticket
```js
{
  ticketNumber:       String  // "HUB-0001", unique
  customerName:       String
  customerEmail:      String
  customerPhone:      String
  source:             "widget" | "manual" | "other"
  assignedTo:         ObjectId → User
  status:             "open" | "in-progress" | "resolved"
  resolvedAt:         Date
  firstMessageAt:     Date    // first customer message
  firstResponseAt:    Date    // first agent reply (used for avg reply time)
  isMissed:           Boolean // set by missedChat utility
  missedAt:           Date
  lastMessageAt:      Date    // drives sort order in ticket lists
  lastMessageSnippet: String  // truncated to 80 chars for preview
  lastMessageFrom:    "customer" | "agent"
  createdAt, updatedAt

  // Indexes: status+assignedTo, assignedTo+lastMessageAt, customerEmail,
  //          isMissed, createdAt, lastMessageAt
}
```

### Message
```js
{
  ticket:      ObjectId → Ticket
  text:        String (can be empty if attachments present)
  senderType:  "agent" | "customer"
  sender:      ObjectId → User  (agents only)
  attachments: [{
    url, filename, originalName, mimetype, size
  }]
  createdAt, updatedAt

  // Index: ticket + createdAt (compound, for fast message loading)
}
```

### ChatbotSettings (singleton)
```js
{
  headerColor, backgroundColor
  messageLine1, messageLine2
  introNameLabel, introPhoneLabel, introEmailLabel, introSubmitLabel
  welcomeMessage
  missedChatThresholdSeconds  // default 60, minimum 5
}
```
> One document only. Fetched via `ChatbotSettings.getSingleton()`.

---

## 5. Backend — API Reference

### Auth  `/api/auth`
| Method | Route | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/signup` | — | firstName, lastName, email, phone, password | `{ token, user }` |
| POST | `/login` | — | email, password | `{ token, user }` |

Rate-limited: 10 attempts / 15 min per IP.

### Users  `/api/users`
| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/me` | ✅ | Current user profile |
| PATCH | `/me` | ✅ | Update name/phone/password |
| GET | `/` | ✅ | All team members |
| POST | `/` | ✅ Admin | Add member; default password = email |
| PATCH | `/:id` | ✅ Admin | Edit name/phone (not admin row) |
| DELETE | `/:id` | ✅ Admin | Delete + reassign tickets to admin |

### Tickets  `/api/tickets`
| Method | Route | Auth | Query / Body |
|---|---|---|---|
| GET | `/` | ✅ | `?status=all\|resolved\|unresolved&search=&page=1&limit=30` → `{ tickets, pagination }` |
| PATCH | `/:id/assign` | ✅ | `{ assignedToUserId }` → sends email + socket event |
| PATCH | `/:id/status` | ✅ | `{ status }` → sends socket event |

Members only see their own assigned tickets; admin sees all.

### Messages  `/api/messages`
| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/ticket/:id` | ✅ | `?before=<msgId>&limit=50` → `{ messages, hasMore }` (cursor pagination) |
| POST | `/ticket/:id` | ✅ | `{ text?, attachments? }` → emits `new-message` via socket |

### Public Chat  `/api/public/chat`  (no auth, rate-limited)
| Method | Route | Body / Query |
|---|---|---|
| POST | `/start` | `{ name, phone, email }` → creates ticket |
| POST | `/:ticketId/messages` | `{ text }` → emits `new-message` |
| GET | `/:ticketId/messages` | `?after=<msgId>` → load newer messages |

### Analytics  `/api/analytics`
| GET `/overview` | Returns `{ totalChats, missedByWeek[], averageReplyTimeSeconds, resolvedRatePercent, resolvedCount }` |

### Chatbot  `/api/chatbot`
| GET `/settings` | Public — widget loads this |
| PUT `/settings` | Admin only — also invalidates the in-memory missed-chat threshold cache |

### Upload  `/api/upload`
| POST `/` | Auth required · multipart/form-data `file` field · returns `{ url, filename, originalName, mimetype, size }` |

---

## 6. Real-time (Socket.io)

### How it works

```
Backend: socket/index.js
  initSocket(httpServer) — called once at startup
  getIO()               — used in routes to broadcast events
  emitNewMessage()      — called after every message create
  emitTicketUpdated()   — called after status/assign changes
```

### Room strategy
- Every ticket has a room named `ticket:<ticketId>`
- Agents join rooms when they open a ticket in ContactCenter
- Customers join their ticket's room when the chat starts
- Messages are broadcast to everyone **else** in the room (`socket.to(room).emit(...)`)

### Events

| Event | Direction | Payload |
|---|---|---|
| `join-ticket` | Client → Server | `ticketId` |
| `leave-ticket` | Client → Server | `ticketId` |
| `typing-start` | Client → Server | `{ ticketId }` |
| `typing-stop` | Client → Server | `{ ticketId }` |
| `new-message` | Server → Client | Message object |
| `ticket-updated` | Server → Client | Populated Ticket object |
| `typing-start` | Server → Client | `{ senderType: "agent"\|"customer" }` |
| `typing-stop` | Server → Client | `{ senderType: "agent"\|"customer" }` |

### Auth
- Agents pass `{ auth: { token } }` in the socket handshake
- Customers connect without a token (`auth: {}`)
- Server sets `socket.user` if JWT is valid; otherwise treats as guest

### Frontend hooks
```js
// useSocket({ withAuth: true })   — for agents in ContactCenter
// useSocket({ withAuth: false })  — for customers in MiniChat
const { socketRef, joinTicket, leaveTicket, emitTypingStart, emitTypingStop } = useSocket()
```

---

## 7. Frontend — Pages & Components

### Route map
```
/                    LandingPage       (public)
/login               LoginPage         (public)
/signup              SignupPage        (public)
/dashboard           DashboardLayout   (auth required — wrapper only)
  index              DashboardHome     ticket list + pagination
  contact-center     ContactCenter     3-panel chat interface
  analytics          Analytics         charts, KPIs
  chatbot            ChatBot           widget customisation
  team-management    TeamManagement    add/edit/delete members
  setting            Setting           own profile + password
```

### Key components

**`MiniChat.jsx`** — customer-facing chat widget
- Embedded on the landing page
- Step 1 (form): collects name/phone/email, calls `POST /api/public/chat/start`
- Step 2 (chat): connects socket, joins ticket room, shows real-time messages + typing indicator
- No polling; fully event-driven after Tier 1

**`ContactCenter.jsx`** — agent chat interface
- Left panel: ticket list (paginated, 30/page)
- Middle panel: message thread with load-more (cursor pagination, 50/load)
- Right panel: customer details, assign teammate, change status
- Socket: joins/leaves rooms as agent switches tickets; shows "customer is typing..." indicator
- File upload: paperclip button → `POST /api/upload` → sends message with attachment

**`ErrorBoundary.jsx`** — wraps the whole app; catches unhandled React errors and shows a reload screen

**`useSocket.js`** — manages Socket.io lifecycle (connect on mount, disconnect on unmount, auto-reconnect)

### `apiClient.js` (fetch wrapper)
```js
api.get(url)              // GET with auth header
api.post(url, data)       // POST JSON
api.put(url, data)        // PUT JSON
api.patch(url, data)      // PATCH JSON
api.delete(url)           // DELETE
api.upload(file)          // multipart POST to /api/upload
```
Throws an `Error` with `err.status` set if response is not 2xx.

---

## 8. Security Measures

| Concern | Implementation |
|---|---|
| HTTP headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| Brute-force auth | express-rate-limit: 10 req/15min on `/api/auth` |
| API spam | express-rate-limit: 300 req/15min on all `/api/*` |
| Widget spam | publicChatLimiter: 60 req/min on public chat routes |
| Input validation | Zod schemas on all write endpoints |
| SQL/NoSQL injection | Mongoose parameterised queries; no `$where` or raw queries |
| Password storage | bcrypt with cost factor 12 |
| JWT | Verified on every authenticated route; expired tokens rejected |
| File uploads | Type allowlist, 10 MB size cap, unique filenames (no user-controlled paths) |
| CORS | Explicit origin whitelist from `CORS_ORIGIN` env var |

---

## 9. Configuration (.env)

Create `backend/.env` with these variables:

```env
# Required
MONGODB_URI=mongodb+srv://...
JWT_SECRET=change-me-to-a-random-64-char-string

# Optional with defaults
PORT=5000
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173      # comma-separated for multiple

# Email notifications (leave blank to disable)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=app-specific-password
SMTP_FROM=Hubly CRM <noreply@yourdomain.com>

# File uploads
UPLOAD_DIR=./uploads                   # absolute or relative to backend/
MAX_FILE_SIZE_MB=10
APP_URL=http://localhost:5000          # used to build file URLs

# Logging
LOG_LEVEL=info                         # error|warn|info|http|debug
LOG_DIR=./logs                         # omit to log to console only
```

Frontend `.env` (create at `frontend/.env`):
```env
VITE_API_BASE=http://localhost:5000
```

---

## 10. Running the Project

### Development
```bash
# Terminal 1 — Backend
cd backend
npm run dev        # nodemon auto-restart

# Terminal 2 — Frontend
cd frontend
npm run dev        # Vite HMR at http://localhost:5173
```

### Production build
```bash
cd frontend && npm run build   # outputs to frontend/dist/
```
Serve `dist/` via Nginx/Caddy or a static host (Vercel, Netlify).

Backend: deploy to any Node.js host (Railway, Render, AWS EC2). Set `NODE_ENV=production`.

---

## 11. Key Design Decisions (Interview Ready)

### Why Socket.io instead of SSE or long-polling?
Socket.io gives **bidirectional** communication — both the customer (typing indicator → agent) and agent (typing → customer) need to send events. SSE is one-direction only. Socket.io also auto-falls back to HTTP long-polling for environments that block WebSockets.

### Why MongoDB instead of PostgreSQL?
Chat messages are naturally document-shaped (nested attachments, optional fields per senderType). MongoDB's flexible schema makes it easy to add new message types without migrations. The trade-off: no multi-document ACID transactions (not needed here).

### Why JWT instead of sessions?
JWTs are stateless — the server doesn't need to store session data. This makes horizontal scaling trivial: any server can verify the token without a shared session store. Trade-off: tokens can't be instantly revoked (mitigated by short expiry + refresh token pattern, planned for Tier 2).

### How is the "missed chat" threshold handled?
A utility (`missedChat.js`) runs on every `GET /api/tickets` response and checks whether `now - firstMessageAt > threshold` with no `firstResponseAt`. It caches the threshold in memory to avoid a DB round-trip on every check. The cache is invalidated whenever an admin updates the chatbot settings.

### Pagination approach: why cursor for messages, offset for tickets?
- **Messages**: Users scroll up to load older ones. Cursor-based (`before=<lastId>`) ensures stable pages even as new messages arrive between requests.
- **Tickets**: Users navigate pages by number. Offset (`page=1&limit=30`) is simpler and adequate since tickets don't change order rapidly.

### Why `sender` (not `senderUser`) in Message?
The original code used `senderUser` which was not defined in the Mongoose schema — Mongoose's strict mode silently strips unknown fields. Fixed to `sender` which matches the schema definition.

### Security: Why Zod over Joi or express-validator?
Zod has native TypeScript types, no runtime overhead from a schema registry, and produces well-structured error objects. The `validate()` middleware factory pattern keeps routes clean.

---

## 12. Production Checklist

- [ ] Set `NODE_ENV=production` on the server
- [ ] Use a strong `JWT_SECRET` (64+ random characters)
- [ ] Enable HTTPS (TLS) via reverse proxy (Nginx, Caddy)
- [ ] Configure `CORS_ORIGIN` to your production frontend domain only
- [ ] Set up MongoDB Atlas IP allowlist
- [ ] Configure `SMTP_*` variables for email notifications
- [ ] Set `LOG_DIR` and rotate logs (logrotate or Papertrail)
- [ ] Add a process manager (PM2) for auto-restart and clustering
- [ ] Set up DB backups (Atlas automated backups or `mongodump` cron)
- [ ] Configure `APP_URL` to your real domain so file upload URLs are correct
- [ ] Enable MongoDB Atlas alerts for connection limits and slow queries
- [ ] Add health-check monitoring (UptimeRobot, Betterstack) on `/api/health`

---

## 13. Tier 2–5 Features Added (Full CRM Upgrade)

### New Data Models (backend/src/models/)
| Model | Purpose |
|---|---|
| `Contact` | People — firstName, lastName, email, phone, company ref, status (lead/prospect/customer/churned/inactive), source, tags, customFields |
| `Company` | Organizations — name, industry, website, tags, customFields |
| `Deal` | Sales opportunities — title, stage (6 stages), value, currency, closeDate, probability (auto-calculated from stage) |
| `Activity` | CRM timeline entries — note/call/email/meeting; links to contact/company/deal/ticket; `isInternal` flag for ticket notes |
| `Task` | Action items — title, assignedTo, priority (low/medium/high/urgent), status, completedAt auto-set |
| `CannedResponse` | Saved reply templates — name, shortcut (/greet), content, isGlobal |
| `Webhook` | Outgoing webhooks — URL, events[], HMAC secret, failCount tracking |
| `Notification` | In-app notifications — userId, type, isRead, pushed via socket |
| `SlaPolicy` | SLA rules — firstResponseTargetMinutes, resolutionTargetMinutes, businessHoursOnly, isDefault |
| `ChatbotAutomation` | Auto-reply rules — triggerType (keyword/working_hours/new_chat), replyText, priority |

### New API Routes
| Endpoint | Description |
|---|---|
| `/api/contacts` | Full CRUD, search, CSV import |
| `/api/companies` | Full CRUD, contact count |
| `/api/deals` | Full CRUD, `/pipeline` endpoint for Kanban |
| `/api/activities` | Notes, calls, emails, meetings per entity |
| `/api/tasks` | Task management with assignee notifications |
| `/api/canned-responses` | Saved reply templates |
| `/api/search?q=` | Global search across all entity types |
| `/api/webhooks` | Outbound webhook management (admin only) |
| `/api/notifications` | In-app notifications with read/unread state |
| `/api/sla` | SLA policy management (admin only) |
| `/api/automation` | Chatbot automation rules |

### Ticket Enhancements
- `labels[]` field added to Ticket model
- `PATCH /api/tickets/:id/labels` — update labels
- `POST /api/tickets/bulk` — bulk resolve/assign/delete
- SLA fields: `slaFirstResponseBreachedAt`, `slaResolutionBreachedAt`

### Analytics Enhancements
- Date range filtering (`?from=&to=`)
- Agent performance tab (tickets handled, resolved, avg first reply per agent)
- Pipeline tab (deals per stage, revenue won)
- CSV export (`/api/analytics/export`)

### Webhook System
Every ticket.created / deal.updated / contact.created etc. fires registered webhooks via `triggerWebhooks(event, payload)` with HMAC-SHA256 signature.

### Slack Integration
`SLACK_WEBHOOK_URL` env var — silent no-op if not set. Fires on new ticket, missed chat, ticket assigned.

### SLA Engine
`checkSla(ticket)` — fetches default SLA policy (in-memory cached), checks first-response and resolution targets, creates notification + sets breach timestamps.

### New Frontend Pages
| Page | Route | Features |
|---|---|---|
| Contacts | `/dashboard/contacts` | Table, search/filter, create/edit/delete modal |
| Companies | `/dashboard/companies` | Table, contact count, CRUD |
| Pipeline | `/dashboard/pipeline` | Kanban board, HTML5 drag-and-drop between stages, total per column |
| Tasks | `/dashboard/tasks` | Card list, checkbox done toggle, priority/status badges, overdue warning |
| Analytics (revamped) | `/dashboard/analytics` | Date range picker, 3 tabs: Overview / Agents / Pipeline, CSV export |

### New Frontend Components
| Component | What it does |
|---|---|
| `GlobalSearch` | Debounced search bar in topbar, results dropdown linking to entity pages |
| `NotificationBell` | Bell icon with unread badge, dropdown, real-time socket push |
| `CannedResponsePicker` | Appears when agent types `/` in message input, filtered by shortcut/name |
| `LabelPicker` | Inline tag editor with preset labels, used in ticket details panel |

### Contact Center Enhancements
- **Reply / Internal Note toggle** — notes go to Activity model, shown in right panel, never visible to customer
- **Canned responses** — type `/` to trigger picker, select to fill input
- **Labels** — editable tags in details panel, synced via PATCH /labels

### PWA
- `frontend/public/manifest.json` — installable app, theme color, icons, `start_url=/dashboard`
- `frontend/public/sw.js` — network-first for API, cache-first for assets, push notification handler
- `index.html` — Inter font, manifest link, service worker registration

### UI Revamp — World-Class Dashboard
- New `DashboardLayout` (`dl-*` CSS classes) — dark navy sidebar, collapsible, user avatar, logout
- 10-item navigation including all new pages
- Topbar with GlobalSearch + NotificationBell + dark mode toggle
- Dark mode via `data-theme="dark"` on `<html>` with CSS custom properties (`--color-*` variables)
- `frontend/src/styles/crm.css` — comprehensive design system: buttons, badges, tables, modals, forms, kanban, stat cards, typography

### Key New Design Decisions (Interview Points)
1. **Why HTML5 drag-and-drop (not a library) for Kanban?** Zero bundle cost, sufficient for desktop CRM use. Libraries like `dnd-kit` add 15kB+ for features we don't need (touch, animations).
2. **Why cursor-based pagination for messages but not contacts?** Messages need stable pages as new ones arrive. Contacts update rarely — offset is simpler and sortable.
3. **How do webhook signatures work?** Each registered webhook optionally stores a `secret`. On fire, `triggerWebhooks` computes `HMAC-SHA256(secret, JSON.stringify(payload))` and sends it as `X-Hubly-Signature: sha256=<hex>`. Receivers verify the signature to prevent spoofing.
4. **How does chatbot automation work?** On every customer message in `publicChat.js`, the system loads active keyword rules sorted by priority, finds the first whose keywords appear in the message (case-insensitive), and auto-posts a reply from the admin account — all in the same HTTP request, no separate worker.
5. **Why in-memory SLA cache?** `SlaPolicy.findOne({isDefault:true})` would run on every ticket status check. A module-level variable with `invalidateSlaPolicyCache()` avoids this overhead entirely — valid because SLA policies change very rarely.
