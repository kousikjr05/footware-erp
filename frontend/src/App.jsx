import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, NavLink } from 'react-router-dom';

// ── Accounts Pages
import PurchaseEntry from './pages/accounts/PurchaseEntry';
import PurchaseClassification from './pages/accounts/PurchaseClassification';
import PurchaseExpenses from './pages/accounts/PurchaseExpenses';
import VendorAccounts from './pages/accounts/VendorAccounts';
import PaymentsReceipts from './pages/accounts/PaymentsReceipts';
import CreditManagement from './pages/accounts/CreditManagement';
import ChequeManagement from './pages/accounts/ChequeManagement';
import Accounting from './pages/accounts/Accounting';
import BankManagement from './pages/accounts/BankManagement';
import GSTManagement from './pages/accounts/GSTManagement';
import ProfitLoss from './pages/accounts/ProfitLoss';
import FinancialReports from './pages/accounts/FinancialReports';
import CapitalWithdrawals from './pages/accounts/CapitalWithdrawals';
import FinancialAlerts from './pages/accounts/FinancialAlerts';

// ── Inventory Pages
import StockOverview from './pages/inventory/StockOverview';
import SizeColourInventory from './pages/inventory/SizeColourInventory';
import StockSearch from './pages/inventory/StockSearch';
import RackManagement from './pages/inventory/RackManagement';
import ProductCatalog from './pages/inventory/ProductCatalog';
import DisplayStock from './pages/inventory/DisplayStock';
import StockTransfer from './pages/inventory/StockTransfer';
import StockAdjustment from './pages/inventory/StockAdjustment';
import BarcodeManagement from './pages/inventory/BarcodeManagement';
import StockValuation from './pages/inventory/StockValuation';
import StockAudit from './pages/inventory/StockAudit';
import DamagedGoods from './pages/inventory/DamagedGoods';
import LowStockAlerts from './pages/inventory/LowStockAlerts';
import StockReports from './pages/inventory/StockReports';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { api } from './api';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function Layout() {
  const { user, logout } = useAuth();
  const [pageTitle, setPageTitle] = useState({ title: 'Dashboard', sub: 'Overview' });
  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={logout} setPageTitle={setPageTitle} />
      <div className="main-content">
        <TopBar title={pageTitle.title} subtitle={pageTitle.sub} user={user} />
        <div className="page-body">
          <Routes>
            <Route path="/" element={<Dashboard setPageTitle={setPageTitle} />} />
            {/* Accounts */}
            <Route path="/accounts/purchase-entry" element={<PurchaseEntry setPageTitle={setPageTitle} />} />
            <Route path="/accounts/purchase-classification" element={<PurchaseClassification setPageTitle={setPageTitle} />} />
            <Route path="/accounts/purchase-expenses" element={<PurchaseExpenses setPageTitle={setPageTitle} />} />
            <Route path="/accounts/vendors" element={<VendorAccounts setPageTitle={setPageTitle} />} />
            <Route path="/accounts/payments" element={<PaymentsReceipts setPageTitle={setPageTitle} />} />
            <Route path="/accounts/credit" element={<CreditManagement setPageTitle={setPageTitle} />} />
            <Route path="/accounts/cheques" element={<ChequeManagement setPageTitle={setPageTitle} />} />
            <Route path="/accounts/accounting" element={<Accounting setPageTitle={setPageTitle} />} />
            <Route path="/accounts/bank" element={<BankManagement setPageTitle={setPageTitle} />} />
            <Route path="/accounts/gst" element={<GSTManagement setPageTitle={setPageTitle} />} />
            <Route path="/accounts/pnl" element={<ProfitLoss setPageTitle={setPageTitle} />} />
            <Route path="/accounts/reports" element={<FinancialReports setPageTitle={setPageTitle} />} />
            <Route path="/accounts/capital" element={<CapitalWithdrawals setPageTitle={setPageTitle} />} />
            <Route path="/accounts/alerts" element={<FinancialAlerts setPageTitle={setPageTitle} />} />
            {/* Inventory */}
            <Route path="/inventory/stock" element={<StockOverview setPageTitle={setPageTitle} />} />
            <Route path="/inventory/size-colour" element={<SizeColourInventory setPageTitle={setPageTitle} />} />
            <Route path="/inventory/search" element={<StockSearch setPageTitle={setPageTitle} />} />
            <Route path="/inventory/racks" element={<RackManagement setPageTitle={setPageTitle} />} />
            <Route path="/inventory/products" element={<ProductCatalog setPageTitle={setPageTitle} />} />
            <Route path="/inventory/display" element={<DisplayStock setPageTitle={setPageTitle} />} />
            <Route path="/inventory/transfers" element={<StockTransfer setPageTitle={setPageTitle} />} />
            <Route path="/inventory/adjustments" element={<StockAdjustment setPageTitle={setPageTitle} />} />
            <Route path="/inventory/barcodes" element={<BarcodeManagement setPageTitle={setPageTitle} />} />
            <Route path="/inventory/valuation" element={<StockValuation setPageTitle={setPageTitle} />} />
            <Route path="/inventory/audit" element={<StockAudit setPageTitle={setPageTitle} />} />
            <Route path="/inventory/damaged" element={<DamagedGoods setPageTitle={setPageTitle} />} />
            <Route path="/inventory/low-stock" element={<LowStockAlerts setPageTitle={setPageTitle} />} />
            <Route path="/inventory/reports" element={<StockReports setPageTitle={setPageTitle} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('erp_user')); } catch { return null; }
  });

  const login = async (username, password) => {
    const data = await api.login(username, password);
    setUser(data.user);
    localStorage.setItem('erp_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('erp_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
