const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'erp.db');

let db = null;
let dbReady = null;

// sql.js wrapper to mimic better-sqlite3 API
class DBWrapper {
  constructor(sqlDb) { this._db = sqlDb; }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        const info = self._db.exec("SELECT last_insert_rowid() as id, changes() as changes");
        self._save();
        return { lastInsertRowid: info[0]?.values[0]?.[0] || 0, changes: info[0]?.values[0]?.[1] || 0 };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        const cols = stmt.getColumnNames();
        const rows = [];
        while (stmt.step()) {
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          rows.push(row);
        }
        stmt.free();
        return rows;
      }
    };
  }

  exec(sql) { this._db.run(sql); this._save(); }
  pragma(str) { try { this._db.run(`PRAGMA ${str}`); } catch(e) { /* ignore */ } }

  _save() {
    try {
      const data = this._db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch(e) { /* ignore save errors */ }
  }
}

async function initDB() {
  const SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(buf);
  } else {
    sqlDb = new SQL.Database();
  }

  db = new DBWrapper(sqlDb);
  db.pragma('journal_mode = WAL');

  // ─── SCHEMA ──────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE, password TEXT, name TEXT, role TEXT
    );
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT, contact TEXT, email TEXT, gst_no TEXT,
      credit_limit REAL DEFAULT 100000, credit_days INTEGER DEFAULT 30,
      address TEXT, outstanding REAL DEFAULT 0, phone TEXT
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_no TEXT UNIQUE, name TEXT, brand TEXT, category TEXT,
      mrp REAL, cost REAL, gst_rate REAL DEFAULT 12
    );
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER, size TEXT, colour TEXT, barcode TEXT UNIQUE,
      FOREIGN KEY(product_id) REFERENCES products(id)
    );
    CREATE TABLE IF NOT EXISTS racks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      floor TEXT, department TEXT, rack_no TEXT, shelf TEXT, position TEXT
    );
    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER, rack_id INTEGER, quantity INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(variant_id) REFERENCES product_variants(id),
      FOREIGN KEY(rack_id) REFERENCES racks(id)
    );
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER, bill_no TEXT, bill_date TEXT,
      type_ab TEXT DEFAULT 'A', gst_type TEXT DEFAULT 'GST',
      total_amount REAL, cgst REAL DEFAULT 0, sgst REAL DEFAULT 0, igst REAL DEFAULT 0,
      status TEXT DEFAULT 'posted', notes TEXT,
      FOREIGN KEY(vendor_id) REFERENCES vendors(id)
    );
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER, variant_id INTEGER, quantity INTEGER,
      rate REAL, amount REAL, gst_rate REAL DEFAULT 12,
      FOREIGN KEY(purchase_id) REFERENCES purchases(id)
    );
    CREATE TABLE IF NOT EXISTS purchase_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER, expense_type TEXT, amount REAL,
      allocated_to TEXT DEFAULT 'all',
      FOREIGN KEY(purchase_id) REFERENCES purchases(id)
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER, type TEXT, amount REAL,
      date TEXT, mode TEXT, reference TEXT, status TEXT DEFAULT 'pending', notes TEXT,
      FOREIGN KEY(vendor_id) REFERENCES vendors(id)
    );
    CREATE TABLE IF NOT EXISTS cheques (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER, type TEXT, amount REAL,
      cheque_no TEXT, bank TEXT, due_date TEXT,
      clearing_date TEXT, status TEXT DEFAULT 'pending', bounce_reason TEXT,
      FOREIGN KEY(vendor_id) REFERENCES vendors(id)
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE, name TEXT, type TEXT, parent_id INTEGER, balance REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER, date TEXT, description TEXT,
      debit REAL DEFAULT 0, credit REAL DEFAULT 0, reference TEXT,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    );
    CREATE TABLE IF NOT EXISTS bank_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_name TEXT, type TEXT, amount REAL,
      date TEXT, reference TEXT, description TEXT, status TEXT DEFAULT 'cleared'
    );
    CREATE TABLE IF NOT EXISTS gst_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT, date TEXT, party TEXT,
      taxable_amount REAL, cgst REAL, sgst REAL, igst REAL, total REAL,
      invoice_no TEXT, gst_category TEXT DEFAULT 'regular'
    );
    CREATE TABLE IF NOT EXISTS capital_withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT, amount REAL, date TEXT, description TEXT, reference TEXT
    );
    CREATE TABLE IF NOT EXISTS display_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER, rack_id INTEGER, quantity INTEGER,
      allocated_date TEXT, returned_date TEXT, status TEXT DEFAULT 'allocated',
      FOREIGN KEY(variant_id) REFERENCES product_variants(id)
    );
    CREATE TABLE IF NOT EXISTS stock_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_rack_id INTEGER, to_rack_id INTEGER, variant_id INTEGER,
      quantity INTEGER, date TEXT, reason TEXT, transferred_by TEXT
    );
    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER, quantity_change INTEGER, reason TEXT,
      date TEXT, notes TEXT, adjusted_by TEXT
    );
    CREATE TABLE IF NOT EXISTS stock_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER, expected_qty INTEGER, actual_qty INTEGER,
      difference INTEGER, audit_date TEXT, auditor TEXT, notes TEXT
    );
    CREATE TABLE IF NOT EXISTS damaged_goods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER, quantity INTEGER, reason TEXT,
      status TEXT DEFAULT 'pending', date TEXT, notes TEXT,
      inspection_date TEXT, disposal_method TEXT
    );
  `);

  // ─── SEED DATA ───────────────────────────────────────────────────────────────
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount > 0) { console.log('✅ Database loaded (existing data)'); return; }

  // Users
  db.prepare('INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)').run('admin','admin123','Admin User','admin');
  db.prepare('INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)').run('accounts','acc123','Rajan Sharma','accounts');
  db.prepare('INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)').run('inventory','inv123','Priya Nair','inventory');

  // Vendors
  const vendors = [
    ['Relaxo Footwear Ltd','9876543210','relaxo@gmail.com','27AABCR1234A1Z5',500000,45,'Plot 12, MIDC Pune',125000,'9876543210'],
    ['Liberty Shoes Pvt Ltd','9988776655','liberty@shoes.com','07AABCL5678B1Z2',750000,60,'Sector 11, Noida',230000,'9988776655'],
    ['Bata India Ltd','8877665544','bata@india.com','19AABCB9012C1Z8',1000000,30,'Park Street, Kolkata',0,'8877665544'],
    ['Paragon Rubber Ind','7766554433','paragon@kl.com','32AABCP3456D1Z3',300000,45,'Calicut, Kerala',89000,'7766554433'],
    ['Action Shoes','9654321098','action@delhi.com','07AABCA6789E1Z9',400000,30,'Karol Bagh, Delhi',0,'9654321098'],
    ['VKC Group','9123456780','vkc@kerala.com','32AABCV0123F1Z6',200000,30,'Kozhikode, Kerala',45000,'9123456780'],
    ['Campus Shoes','8012345678','campus@agra.com','09AABCC4567G1Z2',350000,45,'Agra, UP',67000,'8012345678'],
    ['Khadim Retail Ltd','7901234567','khadim@wb.com','19AABCK8901H1Z5',600000,60,'Kolkata, WB',180000,'7901234567'],
    ['Metro Brands Ltd','9887654321','metro@mumbai.com','27AABCM2345I1Z1',900000,30,'BKC, Mumbai',0,'9887654321'],
    ['Mochi Shoes','8776543210','mochi@gujarat.com','24AABCM6789J1Z8',450000,45,'Ahmedabad, GJ',95000,'8776543210'],
    ['Lakhani Shoes','7665432109','lakhani@up.com','09AABCL0123K1Z4',250000,30,'Faridabad, HR',0,'7665432109'],
    ['SRV Footwear','9554321098','srv@mumbai.com','27AABCS4567L1Z0',180000,30,'Dharavi, Mumbai',28000,'9554321098'],
    ['Ajanta Shoes','8443210987','ajanta@agra.com','09AABCA8901M1Z7',220000,45,'Agra, UP',55000,'8443210987'],
    ['Caravan Shoes','7332109876','caravan@delhi.com','07AABCC2345N1Z3',160000,30,'Lajpat Nagar, Delhi',0,'7332109876'],
    ['Walkway Footwear','9221098765','walkway@blr.com','29AABCW6789O1Z9',280000,30,'Whitefield, BLR',72000,'9221098765'],
  ];
  vendors.forEach(v => db.prepare('INSERT INTO vendors (name,contact,email,gst_no,credit_limit,credit_days,address,outstanding,phone) VALUES (?,?,?,?,?,?,?,?,?)').run(...v));

  // Products
  const products = [
    ['ART001','Comfort Walk Sandal','Relaxo','Sandals',699,320,12],
    ['ART002','Sport Runner Shoe','Campus','Sports',1299,580,12],
    ['ART003','Formal Oxford','Liberty','Formal',2499,1100,12],
    ['ART004','Casual Loafer','Bata','Casual',1899,850,12],
    ['ART005','Ladies Heel','Mochi','Ladies',2199,980,12],
    ['ART006','Kids Canvas','Paragon','Kids',599,250,12],
    ['ART007','Kolhapuri Chappal','VKC','Traditional',899,380,12],
    ['ART008','Trekking Boot','Action','Outdoor',3499,1600,12],
    ['ART009','Flip Flop Basic','Relaxo','Slippers',199,80,12],
    ['ART010','Corporate Derby','Metro','Formal',3999,1800,12],
    ['ART011','Dance Shoe','Khadim','Dance',1599,720,12],
    ['ART012','School Shoe Black','Bata','School',849,380,12],
    ['ART013','Running Pro','Campus','Sports',2299,1050,12],
    ['ART014','Wedge Sandal','Lakhani','Ladies',1699,760,12],
    ['ART015','Mule Slipper','Walkway','Home',399,160,12],
    ['ART016','Ankle Boot','Metro','Casual',4299,1950,12],
    ['ART017','Jute Wedge','Mochi','Ladies',1399,620,12],
    ['ART018','Baby Bootie','Paragon','Kids',449,190,12],
    ['ART019','Leather Sandal','Ajanta','Traditional',1199,540,12],
    ['ART020','Sneaker Hi-Top','Action','Sports',2799,1270,12],
  ];
  products.forEach(p => db.prepare('INSERT INTO products (article_no,name,brand,category,mrp,cost,gst_rate) VALUES (?,?,?,?,?,?,?)').run(...p));

  // Racks
  const racks = [
    ['Ground Floor','Mens','R-01','S-A','P-1'],['Ground Floor','Mens','R-01','S-A','P-2'],
    ['Ground Floor','Mens','R-01','S-B','P-1'],['Ground Floor','Mens','R-02','S-A','P-1'],
    ['Ground Floor','Ladies','R-03','S-A','P-1'],['Ground Floor','Ladies','R-03','S-B','P-1'],
    ['Ground Floor','Kids','R-04','S-A','P-1'],['Ground Floor','Kids','R-04','S-A','P-2'],
    ['First Floor','Sports','R-05','S-A','P-1'],['First Floor','Sports','R-05','S-B','P-1'],
    ['First Floor','Formal','R-06','S-A','P-1'],['First Floor','Formal','R-06','S-B','P-1'],
    ['First Floor','Casual','R-07','S-A','P-1'],['First Floor','Casual','R-07','S-B','P-1'],
    ['Basement','Storage','S-01','S-A','P-1'],['Basement','Storage','S-01','S-B','P-1'],
    ['Basement','Storage','S-02','S-A','P-1'],['Basement','Storage','S-02','S-B','P-1'],
    ['Basement','Clearance','C-01','S-A','P-1'],['Basement','Display','D-01','S-A','P-1'],
  ];
  racks.forEach(r => db.prepare('INSERT INTO racks (floor,department,rack_no,shelf,position) VALUES (?,?,?,?,?)').run(...r));

  // Product Variants + Stock
  const sizes = ['UK6','UK7','UK8','UK9','UK10','UK11'];
  const colours = ['Black','Brown','White','Beige','Navy','Red'];

  let variantId = 1;
  for (let pid = 1; pid <= 20; pid++) {
    const usedSizes = sizes.slice(0, pid % 2 === 0 ? 4 : 6);
    const usedColours = colours.slice(0, Math.min(3, pid % 3 + 1));
    for (const sz of usedSizes) {
      for (const cl of usedColours) {
        const barcode = `BC${String(pid).padStart(3,'0')}${sz.replace('UK','')}${cl.substring(0,2).toUpperCase()}`;
        db.prepare('INSERT INTO product_variants (product_id,size,colour,barcode) VALUES (?,?,?,?)').run(pid, sz, cl, barcode);
        const rackId = ((variantId - 1) % 20) + 1;
        const qty = Math.floor(Math.random() * 20) + 1;
        db.prepare('INSERT INTO stock (variant_id,rack_id,quantity) VALUES (?,?,?)').run(variantId, rackId, qty);
        variantId++;
      }
    }
  }

  // Purchases
  const purchaseDates = ['2024-10-01','2024-10-05','2024-10-10','2024-10-15','2024-10-20',
    '2024-10-25','2024-11-01','2024-11-05','2024-11-10','2024-11-15',
    '2024-11-20','2024-11-25','2024-12-01','2024-12-05','2024-12-10'];

  for (let i = 0; i < 15; i++) {
    const vendorId = (i % 15) + 1;
    const billNo = `BILL-2024-${String(i+1).padStart(4,'0')}`;
    const amount = Math.floor(Math.random() * 80000) + 20000;
    const cgst = Math.floor(amount * 0.06);
    const sgst = Math.floor(amount * 0.06);
    const typeAB = i % 3 === 0 ? 'B' : 'A';
    const gstType = i % 4 === 0 ? 'Non-GST' : 'GST';
    db.prepare('INSERT INTO purchases (vendor_id,bill_no,bill_date,type_ab,gst_type,total_amount,cgst,sgst,status) VALUES (?,?,?,?,?,?,?,?,?)').run(vendorId, billNo, purchaseDates[i], typeAB, gstType, amount+cgst+sgst, cgst, sgst, 'posted');
    const lastId = db.prepare('SELECT last_insert_rowid() as id').get().id;
    if (Math.random() > 0.5) {
      db.prepare('INSERT INTO purchase_expenses (purchase_id,expense_type,amount,allocated_to) VALUES (?,?,?,?)').run(lastId, 'Freight', Math.floor(Math.random()*2000+500), 'all');
    }
    if (Math.random() > 0.7) {
      db.prepare('INSERT INTO purchase_expenses (purchase_id,expense_type,amount,allocated_to) VALUES (?,?,?,?)').run(lastId, 'Packaging', Math.floor(Math.random()*500+200), 'all');
    }
  }

  // Payments
  const payModes = ['NEFT','RTGS','Cheque','Cash','UPI'];
  for (let i = 0; i < 20; i++) {
    const vendorId = (i % 15) + 1;
    const amount = Math.floor(Math.random()*50000+10000);
    const mode = payModes[i % payModes.length];
    db.prepare('INSERT INTO payments (vendor_id,type,amount,date,mode,reference,status,notes) VALUES (?,?,?,?,?,?,?,?)').run(vendorId,'payment',amount,purchaseDates[i%15],mode,`REF-${10000+i}`,i%5===0?'pending':'cleared','');
  }

  // Cheques
  const banks = ['SBI','HDFC','ICICI','Axis','PNB'];
  const chequeStatuses = ['pending','cleared','cleared','pending','bounced'];
  for (let i = 0; i < 12; i++) {
    db.prepare('INSERT INTO cheques (vendor_id,type,amount,cheque_no,bank,due_date,status) VALUES (?,?,?,?,?,?,?)').run(
      (i%15)+1,'payment',Math.floor(Math.random()*30000+5000),
      `CHQ${100000+i}`,banks[i%5],purchaseDates[i%15],chequeStatuses[i%5]);
  }

  // Chart of Accounts
  const accountsList = [
    ['1000','Assets','asset',null,0],['1100','Current Assets','asset',1,0],
    ['1101','Cash in Hand','asset',2,45000],['1102','Bank - SBI','asset',2,285000],
    ['1103','Bank - HDFC','asset',2,195000],['1104','Accounts Receivable','asset',2,0],
    ['1200','Fixed Assets','asset',1,0],['1201','Furniture & Fixtures','asset',7,120000],
    ['1202','Computer & Equipment','asset',7,85000],
    ['2000','Liabilities','liability',null,0],['2100','Current Liabilities','liability',10,0],
    ['2101','Accounts Payable','liability',11,564000],['2102','GST Payable','liability',11,45600],
    ['2103','TDS Payable','liability',11,8900],
    ['3000','Capital','equity',null,0],['3001','Owner Capital','equity',15,1500000],
    ['3002','Drawings','equity',15,0],
    ['4000','Revenue','revenue',null,0],['4001','Sales - Footwear','revenue',18,2850000],
    ['4002','Other Income','revenue',18,25000],
    ['5000','Expenses','expense',null,0],['5001','Purchase - Footwear','expense',21,1980000],
    ['5002','Freight Charges','expense',21,45000],['5003','Rent','expense',21,120000],
    ['5004','Salaries','expense',21,480000],['5005','Electricity','expense',21,36000],
    ['5006','GST Input Credit','expense',21,180000],
  ];
  accountsList.forEach(a => db.prepare('INSERT INTO accounts (code,name,type,parent_id,balance) VALUES (?,?,?,?,?)').run(...a));

  // Ledger Entries
  const ledgerData = [
    [3,purchaseDates[0],'Opening Balance',45000,0,'OB-001'],
    [4,purchaseDates[0],'Opening Balance',285000,0,'OB-002'],
    [5,purchaseDates[0],'Opening Balance',195000,0,'OB-003'],
    [12,purchaseDates[1],'Purchase - Relaxo',0,125000,'BILL-2024-0001'],
    [4,purchaseDates[2],'Payment to Liberty',0,80000,'REF-10001'],
    [19,purchaseDates[3],'Sales - Cash',850000,0,'SALE-001'],
    [3,purchaseDates[4],'Cash Received',50000,0,'CASH-001'],
    [4,purchaseDates[5],'Bank Transfer',0,45000,'TXN-001'],
    [23,purchaseDates[6],'Freight Charges',8500,0,'FRT-001'],
    [24,purchaseDates[7],'Monthly Rent',30000,0,'RENT-001'],
  ];
  ledgerData.forEach(l => db.prepare('INSERT INTO ledger_entries (account_id,date,description,debit,credit,reference) VALUES (?,?,?,?,?,?)').run(...l));

  // Bank Transactions
  [
    ['SBI','credit',850000,purchaseDates[0],'TXN-SBI-001','Sales collection','cleared'],
    ['SBI','debit',125000,purchaseDates[1],'TXN-SBI-002','Payment to Relaxo','cleared'],
    ['HDFC','credit',500000,purchaseDates[2],'TXN-HDFC-001','Sales collection','cleared'],
    ['HDFC','debit',80000,purchaseDates[3],'TXN-HDFC-002','Payment to Liberty','cleared'],
    ['SBI','credit',320000,purchaseDates[4],'TXN-SBI-003','Sales collection','cleared'],
    ['SBI','debit',45000,purchaseDates[5],'TXN-SBI-004','Rent payment','cleared'],
    ['HDFC','debit',30000,purchaseDates[6],'TXN-HDFC-003','Salary advance','pending'],
    ['SBI','credit',175000,purchaseDates[7],'TXN-SBI-005','Sales collection','cleared'],
  ].forEach(b => db.prepare('INSERT INTO bank_transactions (bank_name,type,amount,date,reference,description,status) VALUES (?,?,?,?,?,?,?)').run(...b));

  // GST Entries
  [
    ['input',purchaseDates[0],'Relaxo Footwear',100000,6000,6000,0,112000,'BILL-2024-0001','regular'],
    ['input',purchaseDates[1],'Liberty Shoes',80000,4800,4800,0,89600,'BILL-2024-0002','regular'],
    ['output',purchaseDates[2],'Retail Sales',500000,30000,30000,0,560000,'SALE-INV-001','b2c'],
    ['output',purchaseDates[3],'Retail Sales',380000,22800,22800,0,425600,'SALE-INV-002','b2c'],
    ['input',purchaseDates[4],'Bata India',120000,7200,7200,0,134400,'BILL-2024-0003','regular'],
    ['output',purchaseDates[5],'Retail Sales',420000,25200,25200,0,470400,'SALE-INV-003','b2c'],
  ].forEach(g => db.prepare('INSERT INTO gst_entries (type,date,party,taxable_amount,cgst,sgst,igst,total,invoice_no,gst_category) VALUES (?,?,?,?,?,?,?,?,?,?)').run(...g));

  // Capital & Withdrawals
  [
    ['capital',1000000,'2024-04-01','Opening Capital Contribution','CAP-001'],
    ['capital',500000,'2024-07-01','Additional Capital Infusion','CAP-002'],
    ['withdrawal',50000,'2024-10-01','Personal Withdrawal - Owner','WD-001'],
    ['withdrawal',30000,'2024-11-01','Personal Withdrawal - Owner','WD-002'],
    ['capital',200000,'2024-11-15','Capital Added','CAP-003'],
  ].forEach(c => db.prepare('INSERT INTO capital_withdrawals (type,amount,date,description,reference) VALUES (?,?,?,?,?)').run(...c));

  // Display Stock
  for (let i = 0; i < 10; i++) {
    db.prepare('INSERT INTO display_stock (variant_id,rack_id,quantity,allocated_date,status) VALUES (?,?,?,?,?)').run(
      (i*5)+1, 20, 1, purchaseDates[i%15], i%3===0?'returned':'allocated');
  }

  // Stock Transfers
  for (let i = 0; i < 8; i++) {
    db.prepare('INSERT INTO stock_transfers (from_rack_id,to_rack_id,variant_id,quantity,date,reason,transferred_by) VALUES (?,?,?,?,?,?,?)').run(
      15, (i%14)+1, (i*3)+1, Math.floor(Math.random()*5)+1, purchaseDates[i%15], 'Replenishment', 'Priya Nair');
  }

  // Stock Adjustments
  const adjReasons = ['Damage','Expiry','Count Error','Theft','Return'];
  for (let i = 0; i < 10; i++) {
    db.prepare('INSERT INTO stock_adjustments (variant_id,quantity_change,reason,date,notes,adjusted_by) VALUES (?,?,?,?,?,?)').run(
      (i*4)+1, i%2===0?-2:1, adjReasons[i%5], purchaseDates[i%15], 'Manual adjustment', 'Priya Nair');
  }

  // Stock Audit
  for (let i = 0; i < 15; i++) {
    const exp = Math.floor(Math.random()*15)+5;
    const act = exp + (i%3===0?-2:i%5===0?-1:0);
    db.prepare('INSERT INTO stock_audit (variant_id,expected_qty,actual_qty,difference,audit_date,auditor,notes) VALUES (?,?,?,?,?,?,?)').run(
      (i*2)+1, exp, act, act-exp, purchaseDates[i%15], 'Priya Nair', act===exp?'OK':'Variance found');
  }

  // Damaged Goods
  const damageReasons = ['Water damage','Sole separation','Manufacturing defect','Customer return','Transport damage'];
  const damageStatuses = ['pending','inspected','repaired','disposed','pending'];
  for (let i = 0; i < 10; i++) {
    db.prepare('INSERT INTO damaged_goods (variant_id,quantity,reason,status,date,notes) VALUES (?,?,?,?,?,?)').run(
      (i*3)+1, Math.floor(Math.random()*3)+1, damageReasons[i%5], damageStatuses[i%5], purchaseDates[i%15], 'Noted during audit');
  }

  console.log('✅ Database initialized with demo data');
}

function getDB() {
  return db;
}

module.exports = { getDB, initDB };
