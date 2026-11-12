const router = require('express').Router();
const { getDB } = require('../db');

const db = () => getDB();

// ── STOCK OVERVIEW ─────────────────────────────────────────────
router.get('/stock', (req, res) => {
  const rows = db().prepare(`
    SELECT s.*, pv.size, pv.colour, pv.barcode, p.name, p.article_no, p.brand, p.mrp, p.cost,
      r.floor, r.department, r.rack_no
    FROM stock s
    JOIN product_variants pv ON s.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN racks r ON s.rack_id = r.id
    ORDER BY p.name, pv.size, pv.colour
  `).all();
  res.json(rows);
});

router.get('/stock/summary', (req, res) => {
  const total = db().prepare('SELECT COALESCE(SUM(quantity),0) as val FROM stock').get().val;
  const value = db().prepare(`SELECT COALESCE(SUM(s.quantity * p.cost),0) as val FROM stock s JOIN product_variants pv ON s.variant_id=pv.id JOIN products p ON pv.product_id=p.id`).get().val;
  const lowStock = db().prepare('SELECT COUNT(*) as c FROM stock WHERE quantity < 5').get().c;
  const outOfStock = db().prepare('SELECT COUNT(*) as c FROM stock WHERE quantity = 0').get().c;
  const categories = db().prepare(`
    SELECT p.category, SUM(s.quantity) as qty, SUM(s.quantity*p.cost) as val
    FROM stock s JOIN product_variants pv ON s.variant_id=pv.id JOIN products p ON pv.product_id=p.id
    GROUP BY p.category ORDER BY qty DESC
  `).all();
  res.json({ total, value, lowStock, outOfStock, categories });
});

// ── PRODUCTS ───────────────────────────────────────────────────
router.get('/products', (req, res) => {
  const rows = db().prepare(`
    SELECT p.*, COUNT(pv.id) as variant_count, COALESCE(SUM(s.quantity),0) as total_stock
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    LEFT JOIN stock s ON s.variant_id = pv.id
    GROUP BY p.id ORDER BY p.name
  `).all();
  res.json(rows);
});

router.get('/products/:id/variants', (req, res) => {
  const rows = db().prepare(`
    SELECT pv.*, COALESCE(s.quantity,0) as stock_qty, r.rack_no
    FROM product_variants pv
    LEFT JOIN stock s ON s.variant_id = pv.id
    LEFT JOIN racks r ON s.rack_id = r.id
    WHERE pv.product_id = ?
    ORDER BY pv.size, pv.colour
  `).all(req.params.id);
  res.json(rows);
});

// ── SIZE & COLOUR INVENTORY ────────────────────────────────────
router.get('/size-colour', (req, res) => {
  const { product_id } = req.query;
  let query = `
    SELECT p.name as product, p.article_no, pv.size, pv.colour, COALESCE(s.quantity,0) as qty
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN stock s ON s.variant_id = pv.id
    ${product_id ? 'WHERE p.id = ?' : ''}
    ORDER BY p.name, pv.size, pv.colour
  `;
  const rows = product_id ? db().prepare(query).all(product_id) : db().prepare(query).all();
  res.json(rows);
});

// ── STOCK SEARCH ───────────────────────────────────────────────
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const term = `%${q}%`;
  const rows = db().prepare(`
    SELECT p.name, p.article_no, p.brand, p.mrp, pv.size, pv.colour, pv.barcode,
      COALESCE(s.quantity,0) as qty, r.rack_no, r.shelf, r.department
    FROM products p
    JOIN product_variants pv ON pv.product_id = p.id
    LEFT JOIN stock s ON s.variant_id = pv.id
    LEFT JOIN racks r ON s.rack_id = r.id
    WHERE p.name LIKE ? OR p.article_no LIKE ? OR pv.barcode LIKE ? OR p.brand LIKE ? OR r.rack_no LIKE ?
    ORDER BY p.name LIMIT 50
  `).all(term, term, term, term, term);
  res.json(rows);
});

// ── RACKS ──────────────────────────────────────────────────────
router.get('/racks', (req, res) => {
  const rows = db().prepare(`
    SELECT r.*, COUNT(DISTINCT s.variant_id) as products_count, COALESCE(SUM(s.quantity),0) as total_qty
    FROM racks r
    LEFT JOIN stock s ON s.rack_id = r.id
    GROUP BY r.id ORDER BY r.floor, r.department, r.rack_no
  `).all();
  res.json(rows);
});

router.post('/racks', (req, res) => {
  const { floor, department, rack_no, shelf, position } = req.body;
  const r = db().prepare('INSERT INTO racks (floor,department,rack_no,shelf,position) VALUES (?,?,?,?,?)').run(floor,department,rack_no,shelf||'S-A',position||'P-1');
  res.json({ id: r.lastInsertRowid });
});

// ── PRODUCT LOCATION ───────────────────────────────────────────
router.get('/product-location', (req, res) => {
  const rows = db().prepare(`
    SELECT s.*, p.name, p.article_no, pv.size, pv.colour, pv.barcode,
      r.floor, r.department, r.rack_no, r.shelf, r.position
    FROM stock s
    JOIN product_variants pv ON s.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    JOIN racks r ON s.rack_id = r.id
    WHERE s.quantity > 0
    ORDER BY r.floor, r.department, r.rack_no, p.name
  `).all();
  res.json(rows);
});

router.put('/product-location', (req, res) => {
  const { variant_id, old_rack_id, new_rack_id, quantity } = req.body;
  db().prepare('UPDATE stock SET rack_id=? WHERE variant_id=? AND rack_id=?').run(new_rack_id, variant_id, old_rack_id);
  res.json({ success: true });
});

// ── DISPLAY STOCK ──────────────────────────────────────────────
router.get('/display-stock', (req, res) => {
  const rows = db().prepare(`
    SELECT ds.*, p.name, p.article_no, pv.size, pv.colour, pv.barcode, r.rack_no
    FROM display_stock ds
    JOIN product_variants pv ON ds.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN racks r ON ds.rack_id = r.id
    ORDER BY ds.allocated_date DESC
  `).all();
  res.json(rows);
});

router.post('/display-stock', (req, res) => {
  const { variant_id, rack_id, quantity } = req.body;
  const r = db().prepare('INSERT INTO display_stock (variant_id,rack_id,quantity,allocated_date,status) VALUES (?,?,?,date(\'now\'),\'allocated\')').run(variant_id,rack_id,quantity);
  res.json({ id: r.lastInsertRowid });
});

router.put('/display-stock/:id/return', (req, res) => {
  db().prepare("UPDATE display_stock SET status='returned',returned_date=date('now') WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

// ── STOCK TRANSFERS ────────────────────────────────────────────
router.get('/transfers', (req, res) => {
  const rows = db().prepare(`
    SELECT st.*, p.name, pv.size, pv.colour,
      fr.rack_no as from_rack, tr.rack_no as to_rack
    FROM stock_transfers st
    JOIN product_variants pv ON st.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN racks fr ON st.from_rack_id = fr.id
    LEFT JOIN racks tr ON st.to_rack_id = tr.id
    ORDER BY st.date DESC
  `).all();
  res.json(rows);
});

router.post('/transfers', (req, res) => {
  const { from_rack_id, to_rack_id, variant_id, quantity, reason } = req.body;
  const fromStock = db().prepare('SELECT * FROM stock WHERE variant_id=? AND rack_id=?').get(variant_id, from_rack_id);
  if (!fromStock || fromStock.quantity < quantity) return res.status(400).json({ error: 'Insufficient stock' });
  
  db().prepare('UPDATE stock SET quantity=quantity-? WHERE variant_id=? AND rack_id=?').run(quantity, variant_id, from_rack_id);
  const toStock = db().prepare('SELECT * FROM stock WHERE variant_id=? AND rack_id=?').get(variant_id, to_rack_id);
  if (toStock) {
    db().prepare('UPDATE stock SET quantity=quantity+? WHERE variant_id=? AND rack_id=?').run(quantity, variant_id, to_rack_id);
  } else {
    db().prepare('INSERT INTO stock (variant_id,rack_id,quantity) VALUES (?,?,?)').run(variant_id, to_rack_id, quantity);
  }
  const r = db().prepare('INSERT INTO stock_transfers (from_rack_id,to_rack_id,variant_id,quantity,date,reason,transferred_by) VALUES (?,?,?,?,date(\'now\'),?,?)').run(from_rack_id,to_rack_id,variant_id,quantity,reason||'Manual transfer','System User');
  res.json({ id: r.lastInsertRowid });
});

// ── STOCK ADJUSTMENTS ──────────────────────────────────────────
router.get('/adjustments', (req, res) => {
  const rows = db().prepare(`
    SELECT sa.*, p.name, pv.size, pv.colour FROM stock_adjustments sa
    JOIN product_variants pv ON sa.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    ORDER BY sa.date DESC
  `).all();
  res.json(rows);
});

router.post('/adjustments', (req, res) => {
  const { variant_id, quantity_change, reason, notes } = req.body;
  db().prepare('UPDATE stock SET quantity=quantity+? WHERE variant_id=?').run(quantity_change, variant_id);
  const r = db().prepare("INSERT INTO stock_adjustments (variant_id,quantity_change,reason,date,notes,adjusted_by) VALUES (?,?,?,date('now'),?,?)").run(variant_id,quantity_change,reason,notes||'','System User');
  res.json({ id: r.lastInsertRowid });
});

// ── STOCK AUDIT ────────────────────────────────────────────────
router.get('/audit', (req, res) => {
  const rows = db().prepare(`
    SELECT sa.*, p.name, pv.size, pv.colour FROM stock_audit sa
    JOIN product_variants pv ON sa.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    ORDER BY sa.audit_date DESC
  `).all();
  res.json(rows);
});

router.post('/audit', (req, res) => {
  const { variant_id, expected_qty, actual_qty, notes } = req.body;
  const difference = actual_qty - expected_qty;
  const r = db().prepare("INSERT INTO stock_audit (variant_id,expected_qty,actual_qty,difference,audit_date,auditor,notes) VALUES (?,?,?,?,date('now'),?,?)").run(variant_id,expected_qty,actual_qty,difference,'System User',notes||'');
  res.json({ id: r.lastInsertRowid });
});

// ── AGEING INVENTORY ───────────────────────────────────────────
router.get('/ageing', (req, res) => {
  const rows = db().prepare(`
    SELECT p.name, p.article_no, p.brand, p.category, p.mrp, p.cost,
      pv.size, pv.colour, COALESCE(s.quantity,0) as qty,
      s.last_updated,
      CAST((julianday('now') - julianday(s.last_updated)) AS INTEGER) as days_old
    FROM products p
    JOIN product_variants pv ON pv.product_id = p.id
    LEFT JOIN stock s ON s.variant_id = pv.id
    WHERE s.quantity > 0
    ORDER BY days_old DESC
  `).all();
  res.json(rows);
});

// ── CLEARANCE STOCK ────────────────────────────────────────────
router.get('/clearance', (req, res) => {
  const rows = db().prepare(`
    SELECT p.name, p.article_no, p.brand, p.mrp, p.cost, pv.size, pv.colour, pv.barcode,
      COALESCE(s.quantity,0) as qty, r.rack_no,
      CAST((julianday('now') - julianday(s.last_updated)) AS INTEGER) as days_old
    FROM products p
    JOIN product_variants pv ON pv.product_id = p.id
    LEFT JOIN stock s ON s.variant_id = pv.id
    LEFT JOIN racks r ON s.rack_id = r.id AND r.department = 'Clearance'
    WHERE s.quantity > 0
    ORDER BY days_old DESC
    LIMIT 50
  `).all();
  res.json(rows);
});

// ── DAMAGED GOODS ──────────────────────────────────────────────
router.get('/damaged', (req, res) => {
  const rows = db().prepare(`
    SELECT dg.*, p.name, pv.size, pv.colour FROM damaged_goods dg
    JOIN product_variants pv ON dg.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    ORDER BY dg.date DESC
  `).all();
  res.json(rows);
});

router.post('/damaged', (req, res) => {
  const { variant_id, quantity, reason, notes } = req.body;
  db().prepare('UPDATE stock SET quantity=quantity-? WHERE variant_id=?').run(quantity, variant_id);
  const r = db().prepare("INSERT INTO damaged_goods (variant_id,quantity,reason,status,date,notes) VALUES (?,?,?,'pending',date('now'),?)").run(variant_id,quantity,reason,notes||'');
  res.json({ id: r.lastInsertRowid });
});

router.put('/damaged/:id', (req, res) => {
  const { status, inspection_date, disposal_method } = req.body;
  db().prepare('UPDATE damaged_goods SET status=?,inspection_date=?,disposal_method=? WHERE id=?').run(status,inspection_date||null,disposal_method||null,req.params.id);
  res.json({ success: true });
});

// ── INVENTORY REPORTS ──────────────────────────────────────────
router.get('/reports/summary', (req, res) => {
  const byCategory = db().prepare(`
    SELECT p.category, COUNT(DISTINCT p.id) as products, SUM(s.quantity) as qty, SUM(s.quantity*p.cost) as value
    FROM stock s JOIN product_variants pv ON s.variant_id=pv.id JOIN products p ON pv.product_id=p.id
    GROUP BY p.category
  `).all();
  const byBrand = db().prepare(`
    SELECT p.brand, SUM(s.quantity) as qty, SUM(s.quantity*p.mrp) as mrp_value
    FROM stock s JOIN product_variants pv ON s.variant_id=pv.id JOIN products p ON pv.product_id=p.id
    GROUP BY p.brand ORDER BY qty DESC
  `).all();
  res.json({ byCategory, byBrand });
});

// ── STOCK ALERTS ───────────────────────────────────────────────
router.get('/alerts', (req, res) => {
  const lowStock = db().prepare(`
    SELECT p.name, p.article_no, pv.size, pv.colour, s.quantity
    FROM stock s JOIN product_variants pv ON s.variant_id=pv.id JOIN products p ON pv.product_id=p.id
    WHERE s.quantity < 5 AND s.quantity > 0 ORDER BY s.quantity ASC LIMIT 20
  `).all();
  const outOfStock = db().prepare(`
    SELECT p.name, p.article_no, pv.size, pv.colour FROM stock s
    JOIN product_variants pv ON s.variant_id=pv.id JOIN products p ON pv.product_id=p.id
    WHERE s.quantity = 0 LIMIT 20
  `).all();
  const pendingDamaged = db().prepare("SELECT COUNT(*) as c FROM damaged_goods WHERE status='pending'").get().c;
  const ageingItems = db().prepare(`
    SELECT COUNT(*) as c FROM stock s WHERE s.quantity > 0
    AND (julianday('now') - julianday(s.last_updated)) > 90
  `).get().c;
  res.json({ lowStock, outOfStock, pendingDamaged, ageingItems });
});

// ── BARCODES ──────────────────────────────────────────────────
router.get('/barcodes', (req, res) => {
  const rows = db().prepare(`
    SELECT pv.id, pv.barcode, pv.size, pv.colour, p.name as product_name, p.article_no,
      p.brand, p.category, p.mrp, COALESCE(s.quantity,0) as stock_qty
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN stock s ON s.variant_id = pv.id
    WHERE pv.barcode IS NOT NULL
    ORDER BY p.name, pv.size, pv.colour
  `).all();
  res.json(rows);
});

// ── STOCK VALUATION ───────────────────────────────────────────
router.get('/valuation', (req, res) => {
  const total = db().prepare(`SELECT COALESCE(SUM(s.quantity * p.cost),0) as cost_value, COALESCE(SUM(s.quantity * p.mrp),0) as retail_value, COALESCE(SUM(s.quantity),0) as total_qty FROM stock s JOIN product_variants pv ON s.variant_id=pv.id JOIN products p ON pv.product_id=p.id`).get();
  const byCategory = db().prepare(`
    SELECT p.category, SUM(s.quantity) as qty, SUM(s.quantity*p.cost) as cost_value, SUM(s.quantity*p.mrp) as retail_value
    FROM stock s JOIN product_variants pv ON s.variant_id=pv.id JOIN products p ON pv.product_id=p.id
    GROUP BY p.category ORDER BY cost_value DESC
  `).all();
  const byBrand = db().prepare(`
    SELECT p.brand, SUM(s.quantity) as qty, SUM(s.quantity*p.cost) as cost_value, SUM(s.quantity*p.mrp) as retail_value
    FROM stock s JOIN product_variants pv ON s.variant_id=pv.id JOIN products p ON pv.product_id=p.id
    GROUP BY p.brand ORDER BY cost_value DESC
  `).all();
  res.json({ ...total, byCategory, byBrand });
});

// ── LOW STOCK ALERTS ──────────────────────────────────────────
router.get('/low-stock', (req, res) => {
  const lowStock = db().prepare(`
    SELECT p.name, p.article_no, p.brand, p.category, pv.size, pv.colour, s.quantity as qty
    FROM stock s JOIN product_variants pv ON s.variant_id=pv.id JOIN products p ON pv.product_id=p.id
    WHERE s.quantity > 0 AND s.quantity < 5 ORDER BY s.quantity ASC LIMIT 30
  `).all();
  const outOfStock = db().prepare(`
    SELECT p.name, p.article_no, p.brand, p.category, pv.size, pv.colour
    FROM stock s JOIN product_variants pv ON s.variant_id=pv.id JOIN products p ON pv.product_id=p.id
    WHERE s.quantity = 0 LIMIT 30
  `).all();
  res.json({ lowStock, outOfStock });
});

// ── ADD PRODUCT ───────────────────────────────────────────────
router.post('/products', (req, res) => {
  const { article_no, name, brand, category, cost_price, mrp, hsn_code } = req.body;
  try {
    const r = db().prepare('INSERT INTO products (article_no,name,brand,category,cost,mrp,gst_rate) VALUES (?,?,?,?,?,?,12)').run(article_no, name, brand, category, cost_price||0, mrp||0);
    res.json({ id: r.lastInsertRowid });
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;

