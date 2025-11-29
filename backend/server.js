const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')

const app = express()
app.use(cors())
app.use(bodyParser.json())

// In-memory stores (replace with DB later)
const users = [] // { id, name, email, phone, role, passwordHash, createdAt }
const sessions = {} // token -> userId
const tickets = [] // simple ticket store for now

// ---------- Helpers ----------
function findUserByEmail(email) {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase())
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' })
  const [, token] = authHeader.split(' ')
  if (!token || !sessions[token]) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  const userId = sessions[token]
  const user = users.find(u => u.id === userId)
  if (!user) return res.status(401).json({ message: 'Unauthorized' })
  req.user = user
  req.token = token
  next()
}

// ---------- Auth Routes ----------

// Initial admin signup - ONLY allowed if no admin exists yet
app.post('/api/auth/signup-initial', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, password required' })
    }

    const existingAdmin = users.find(u => u.role === 'admin')
    if (existingAdmin) {
      return res.status(403).json({ message: 'Initial admin already created' })
    }

    if (findUserByEmail(email)) {
      return res.status(409).json({ message: 'Email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = {
      id: uuidv4(),
      name,
      email,
      phone: phone || '',
      role: 'admin',
      passwordHash,
      createdAt: new Date(),
    }
    users.push(user)

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    const user = findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = uuidv4()
    sessions[token] = user.id

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const u = req.user
  res.json({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    createdAt: u.createdAt,
  })
})

// Logout (invalidate current session token)
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  delete sessions[req.token]
  res.json({ message: 'Logged out' })
})

// ---------- Ticket Routes (from landing mini chat) ----------

// Create ticket from landing page
app.post('/api/tickets', (req, res) => {
  const { name, email, phone } = req.body
  if (!name || !email || !phone) {
    return res.status(400).json({ message: 'Missing fields' })
  }

  // Try to find an admin to assign; if none, keep null
  const admin = users.find(u => u.role === 'admin')
  const assignedTo = admin ? admin.id : null

  const ticket = {
    ticketId: 'TICKET-' + uuidv4().slice(0, 8).toUpperCase(),
    user: { name, email, phone },
    assignedTo,
    status: 'open',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  tickets.push(ticket)
  return res.status(201).json(ticket)
})

// List tickets (later we will restrict to authenticated admin/team)
app.get('/api/tickets', authMiddleware, (req, res) => {
  res.json(tickets)
})

app.get('/api/tickets/:id', authMiddleware, (req, res) => {
  const t = tickets.find(x => x.ticketId === req.params.id)
  if (!t) return res.status(404).json({ message: 'Ticket not found' })
  res.json(t)
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log('Server running on', PORT))
