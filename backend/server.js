const express = require('express');
const cors = require('cors');
const { initDB, getDB } = require('./db');
const accountsRouter = require('./routes/accounts');
const inventoryRouter = require('./routes/inventory');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/accounts', accountsRouter);
app.use('/api/inventory', inventoryRouter);

// Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ user: { id: user.id, username: user.username, name: user.name, role: user.role } });
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
