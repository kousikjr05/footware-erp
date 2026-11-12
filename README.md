# 👟 Footwear Retail Management System

A full-stack ERP system for footwear retail businesses — managing **Accounts** (14 modules) and **Inventory** (14 modules) in a single web application.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Node](https://img.shields.io/badge/Node.js-Express-green) ![SQLite](https://img.shields.io/badge/SQLite-sql.js-orange)

## Features

### Accounts Module (14 sub-modules)
- Purchase Entry, Classification & Expenses
- Vendor Accounts & Credit Management
- Payments & Receipts Register
- Cheque Management (entry, clearing, bounce)
- Chart of Accounts, Ledgers, Cash & Bank Books
- Bank Deposits, Transfers & Reconciliation
- GST Management (Input/Output, Reports)
- Profit & Loss Statement
- Financial Reports (Balance Sheet, Trial Balance)
- Capital & Withdrawals
- Financial Alerts (overdue, pending)

### Inventory Module (14 sub-modules)
- Stock Overview with Size/Colour variants
- Product Catalog with barcode management
- Rack Management (floor/department/shelf)
- Display Stock allocation
- Stock Transfers, Adjustments & Audit
- Damaged Goods tracking
- Low Stock Alerts
- Stock Valuation & Reports

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 6 |
| Styling | Vanilla CSS (dark glassmorphism theme) |
| Charts | Chart.js + react-chartjs-2 |
| Icons | Lucide React |
| Backend | Express.js 4 |
| Database | SQLite via sql.js (pure JS, no native deps) |

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start both frontend & backend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api

## Project Structure

```
footwear-erp/
├── backend/
│   ├── server.js          # Express server
│   ├── db.js              # SQLite init + seed data
│   └── routes/
│       ├── accounts.js    # 14 accounts API endpoints
│       └── inventory.js   # 14+ inventory API endpoints
├── frontend/
│   └── src/
│       ├── App.jsx        # Router + auth
│       ├── index.css      # Dark theme design system
│       ├── components/    # Sidebar, TopBar, DataTable, Modal
│       └── pages/
│           ├── accounts/  # 14 account pages
│           └── inventory/ # 14 inventory pages
└── package.json
```

## Demo Data

Seeded with realistic footwear company data:
- 15 vendors (Relaxo, Liberty, Bata, etc.)
- 20 products across 12 categories
- 204 size/colour variants with barcodes
- Purchases, payments, cheques, GST entries, and more

## License

MIT
