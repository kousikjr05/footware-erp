const express = require('express');
const cors = require('cors');
const { initDB, getDB } = require('./db');
const accountsRouter = require('./routes/accounts');
const inventoryRouter = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow all origins in production for now
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Footwear ERP Backend is running' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/accounts', accountsRouter);
app.use('/api/inventory', inventoryRouter);

// Auth
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, hasPassword: !!password });
    const db = getDB();
    if (!db) return res.status(500).json({ error: 'Database not ready' });
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    if (!user) {
      console.log('Login failed for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log('Login success for:', username);
    res.json({ user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/dashboard/stats', (req, res) => {
  const db = getDB();
  const totalVendors = db.prepare('SELECT COUNT(*) as c FROM vendors').get().c;
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const totalStock = db.prepare('SELECT COALESCE(SUM(quantity),0) as c FROM stock').get().c;
  const pendingPayments = db.prepare("SELECT COALESCE(SUM(amount),0) as c FROM payments WHERE status='pending'").get().c;
  const totalPurchases = db.prepare('SELECT COALESCE(SUM(total_amount),0) as c FROM purchases').get().c;
  const overdueVendors = db.prepare("SELECT COUNT(*) as c FROM vendors WHERE outstanding > credit_limit").get().c;
  const lowStock = db.prepare('SELECT COUNT(*) as c FROM stock WHERE quantity < 5').get().c;
  const damagedGoods = db.prepare("SELECT COUNT(*) as c FROM damaged_goods WHERE status='pending'").get().c;
  res.json({ totalVendors, totalProducts, totalStock, pendingPayments, totalPurchases, overdueVendors, lowStock, damagedGoods });
});

// Init DB (async) then start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Footwear ERP Backend running at http://localhost:${PORT}`);
    console.log(`   API ready at http://localhost:${PORT}/api\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
