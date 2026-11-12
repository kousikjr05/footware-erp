const router = require('express').Router();
const { getDB } = require('../db');

const db = () => getDB();

// ── PURCHASES ──────────────────────────────────────────────────
router.get('/purchases', (req, res) => {
  const rows = db().prepare(`
    SELECT p.*, v.name as vendor_name FROM purchases p
    LEFT JOIN vendors v ON p.vendor_id = v.id
    ORDER BY p.bill_date DESC
  `).all();
  res.json(rows);
});

router.post('/purchases', (req, res) => {
  const { vendor_id, bill_no, bill_date, type_ab, gst_type, total_amount, cgst, sgst, igst, notes, status } = req.body;
  const r = db().prepare(`INSERT INTO purchases (vendor_id,bill_no,bill_date,type_ab,gst_type,total_amount,cgst,sgst,igst,notes,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).run(vendor_id, bill_no, bill_date, type_ab||'A', gst_type||'GST', total_amount, cgst||0, sgst||0, igst||0, notes||'', status||'posted');
  res.json({ id: r.lastInsertRowid });
});

router.put('/purchases/:id', (req, res) => {
  const { status } = req.body;
  db().prepare('UPDATE purchases SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success: true });
});

// ── PURCHASE EXPENSES ──────────────────────────────────────────
router.get('/purchase-expenses', (req, res) => {
  const rows = db().prepare(`
    SELECT pe.*, p.bill_no, v.name as vendor_name FROM purchase_expenses pe
    LEFT JOIN purchases p ON pe.purchase_id = p.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    ORDER BY pe.id DESC
  `).all();
  res.json(rows);
});

router.post('/purchase-expenses', (req, res) => {
  const { purchase_id, expense_type, amount, allocated_to } = req.body;
  const r = db().prepare('INSERT INTO purchase_expenses (purchase_id,expense_type,amount,allocated_to) VALUES (?,?,?,?)').run(purchase_id, expense_type, amount, allocated_to||'all');
  res.json({ id: r.lastInsertRowid });
});

// ── VENDORS ────────────────────────────────────────────────────
router.get('/vendors', (req, res) => {
  res.json(db().prepare('SELECT * FROM vendors ORDER BY name').all());
});

router.post('/vendors', (req, res) => {
  const { name, contact, email, gst_no, credit_limit, credit_days, address, phone } = req.body;
  const r = db().prepare('INSERT INTO vendors (name,contact,email,gst_no,credit_limit,credit_days,address,phone) VALUES (?,?,?,?,?,?,?,?)').run(name,contact,email,gst_no,credit_limit||100000,credit_days||30,address,phone||contact);
  res.json({ id: r.lastInsertRowid });
});

router.get('/vendors/:id/ledger', (req, res) => {
  const purchases = db().prepare("SELECT 'purchase' as type, bill_date as date, bill_no as ref, total_amount as amount, 'Bill posted' as desc FROM purchases WHERE vendor_id=?").all(req.params.id);
  const payments = db().prepare("SELECT 'payment' as type, date, reference as ref, amount, mode as desc FROM payments WHERE vendor_id=?").all(req.params.id);
  const all = [...purchases, ...payments].sort((a,b) => a.date.localeCompare(b.date));
  res.json(all);
});

// ── PAYMENTS & RECEIPTS ────────────────────────────────────────
router.get('/payments', (req, res) => {
  const rows = db().prepare(`
    SELECT p.*, v.name as vendor_name FROM payments p
    LEFT JOIN vendors v ON p.vendor_id = v.id
    ORDER BY p.date DESC
  `).all();
  res.json(rows);
});

router.post('/payments', (req, res) => {
  const { vendor_id, type, amount, date, mode, reference, notes } = req.body;
  const r = db().prepare('INSERT INTO payments (vendor_id,type,amount,date,mode,reference,status,notes) VALUES (?,?,?,?,?,?,?,?)').run(vendor_id,type||'payment',amount,date,mode,reference,'pending',notes||'');
  if (type === 'payment') {
    db().prepare('UPDATE vendors SET outstanding = outstanding - ? WHERE id = ?').run(amount, vendor_id);
  }
  res.json({ id: r.lastInsertRowid });
});

router.put('/payments/:id', (req, res) => {
  const { status } = req.body;
  db().prepare('UPDATE payments SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success: true });
});

// ── CREDIT MANAGEMENT ─────────────────────────────────────────
router.get('/credit', (req, res) => {
  const vendors = db().prepare('SELECT *, (outstanding*100/NULLIF(credit_limit,0)) as utilization_pct FROM vendors ORDER BY outstanding DESC').all();
  res.json(vendors);
});

// ── CHEQUE MANAGEMENT ─────────────────────────────────────────
router.get('/cheques', (req, res) => {
  const rows = db().prepare(`
    SELECT c.*, v.name as vendor_name FROM cheques c
    LEFT JOIN vendors v ON c.vendor_id = v.id
    ORDER BY c.due_date DESC
  `).all();
  res.json(rows);
});

router.post('/cheques', (req, res) => {
  const { vendor_id, type, amount, cheque_no, bank, due_date } = req.body;
  const r = db().prepare('INSERT INTO cheques (vendor_id,type,amount,cheque_no,bank,due_date,status) VALUES (?,?,?,?,?,?,?)').run(vendor_id,type,amount,cheque_no,bank,due_date,'pending');
  res.json({ id: r.lastInsertRowid });
});

router.put('/cheques/:id', (req, res) => {
  const { status, clearing_date, bounce_reason } = req.body;
  db().prepare('UPDATE cheques SET status=?,clearing_date=?,bounce_reason=? WHERE id=?').run(status,clearing_date||null,bounce_reason||null,req.params.id);
  res.json({ success: true });
});

// ── ACCOUNTING ─────────────────────────────────────────────────
router.get('/accounts', (req, res) => {
  res.json(db().prepare('SELECT * FROM accounts ORDER BY code').all());
});

router.get('/ledger', (req, res) => {
  const rows = db().prepare(`
    SELECT le.*, a.name as account_name, a.code FROM ledger_entries le
    LEFT JOIN accounts a ON le.account_id = a.id
    ORDER BY le.date DESC
    LIMIT 100
  `).all();
  res.json(rows);
});

router.post('/ledger', (req, res) => {
  const { account_id, date, description, debit, credit, reference } = req.body;
  const r = db().prepare('INSERT INTO ledger_entries (account_id,date,description,debit,credit,reference) VALUES (?,?,?,?,?,?)').run(account_id,date,description,debit||0,credit||0,reference||'');
  res.json({ id: r.lastInsertRowid });
});

// ── BANK MANAGEMENT ────────────────────────────────────────────
router.get('/bank', (req, res) => {
  res.json(db().prepare('SELECT * FROM bank_transactions ORDER BY date DESC').all());
});

router.post('/bank', (req, res) => {
  const { bank_name, type, amount, date, reference, description } = req.body;
  const r = db().prepare('INSERT INTO bank_transactions (bank_name,type,amount,date,reference,description) VALUES (?,?,?,?,?,?)').run(bank_name,type,amount,date,reference||'',description||'');
  res.json({ id: r.lastInsertRowid });
});

router.get('/bank/summary', (req, res) => {
  const summary = db().prepare(`
    SELECT bank_name,
      SUM(CASE WHEN type='credit' THEN amount ELSE 0 END) as total_credit,
      SUM(CASE WHEN type='debit' THEN amount ELSE 0 END) as total_debit,
      SUM(CASE WHEN type='credit' THEN amount ELSE -amount END) as balance
    FROM bank_transactions GROUP BY bank_name
  `).all();
  res.json(summary);
});

// ── GST ────────────────────────────────────────────────────────
router.get('/gst', (req, res) => {
  res.json(db().prepare('SELECT * FROM gst_entries ORDER BY date DESC').all());
});

router.get('/gst/summary', (req, res) => {
  const input = db().prepare("SELECT SUM(taxable_amount) as taxable, SUM(cgst) as cgst, SUM(sgst) as sgst, SUM(igst) as igst FROM gst_entries WHERE type='input'").get();
  const output = db().prepare("SELECT SUM(taxable_amount) as taxable, SUM(cgst) as cgst, SUM(sgst) as sgst, SUM(igst) as igst FROM gst_entries WHERE type='output'").get();
  const liability = (output.cgst||0) - (input.cgst||0) + (output.sgst||0) - (input.sgst||0) + (output.igst||0) - (input.igst||0);
  res.json({ input, output, liability });
});

// ── P&L ────────────────────────────────────────────────────────
router.get('/pnl', (req, res) => {
  const sales = db().prepare("SELECT COALESCE(SUM(balance),0) as val FROM accounts WHERE code='4001'").get().val;
  const otherIncome = db().prepare("SELECT COALESCE(SUM(balance),0) as val FROM accounts WHERE code='4002'").get().val;
  const purchases_cost = db().prepare("SELECT COALESCE(SUM(balance),0) as val FROM accounts WHERE code='5001'").get().val;
  const freight = db().prepare("SELECT COALESCE(SUM(balance),0) as val FROM accounts WHERE code='5002'").get().val;
  const rent = db().prepare("SELECT COALESCE(SUM(balance),0) as val FROM accounts WHERE code='5003'").get().val;
  const salaries = db().prepare("SELECT COALESCE(SUM(balance),0) as val FROM accounts WHERE code='5004'").get().val;
  const electricity = db().prepare("SELECT COALESCE(SUM(balance),0) as val FROM accounts WHERE code='5005'").get().val;
  const totalRevenue = sales + otherIncome;
  const cogs = purchases_cost + freight;
  const grossProfit = totalRevenue - cogs;
  const totalExpenses = rent + salaries + electricity;
  const netProfit = grossProfit - totalExpenses;
  res.json({ sales, otherIncome, totalRevenue, purchases_cost, freight, cogs, grossProfit, rent, salaries, electricity, totalExpenses, netProfit });
});

// ── FINANCIAL REPORTS ──────────────────────────────────────────
router.get('/balance-sheet', (req, res) => {
  const assets = db().prepare("SELECT * FROM accounts WHERE type='asset' ORDER BY code").all();
  const liabilities = db().prepare("SELECT * FROM accounts WHERE type='liability' ORDER BY code").all();
  const equity = db().prepare("SELECT * FROM accounts WHERE type='equity' ORDER BY code").all();
  res.json({ assets, liabilities, equity });
});

router.get('/trial-balance', (req, res) => {
  const rows = db().prepare(`
    SELECT a.code, a.name, a.type,
      COALESCE(SUM(le.debit),0) as total_debit,
      COALESCE(SUM(le.credit),0) as total_credit
    FROM accounts a
    LEFT JOIN ledger_entries le ON a.id = le.account_id
    GROUP BY a.id ORDER BY a.code
  `).all();
  res.json(rows);
});

// ── CAPITAL & WITHDRAWALS ──────────────────────────────────────
router.get('/capital', (req, res) => {
  res.json(db().prepare('SELECT * FROM capital_withdrawals ORDER BY date DESC').all());
});

router.post('/capital', (req, res) => {
  const { type, amount, date, description, reference } = req.body;
  const r = db().prepare('INSERT INTO capital_withdrawals (type,amount,date,description,reference) VALUES (?,?,?,?,?)').run(type,amount,date,description||'',reference||'');
  res.json({ id: r.lastInsertRowid });
});

// ── FINANCIAL ALERTS ───────────────────────────────────────────
router.get('/alerts', (req, res) => {
  const overdueVendors = db().prepare("SELECT name, outstanding, credit_limit FROM vendors WHERE outstanding > credit_limit").all();
  const pendingCheques = db().prepare("SELECT c.*, v.name as vendor_name FROM cheques c LEFT JOIN vendors v ON c.vendor_id=v.id WHERE c.status='pending' AND c.due_date <= date('now','+7 days')").all();
  const pendingPayments = db().prepare("SELECT p.*, v.name as vendor_name FROM payments p LEFT JOIN vendors v ON p.vendor_id=v.id WHERE p.status='pending'").all();
  res.json({ overdueVendors, pendingCheques, pendingPayments });
});

module.exports = router;
