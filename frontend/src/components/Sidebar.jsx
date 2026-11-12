import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Tags, Package, Users, CreditCard,
  AlertTriangle, FileCheck, BookOpen, Building2, Receipt, TrendingUp,
  BarChart3, Wallet, Bell, Box, Palette, Search, Grid3x3, MapPin,
  Monitor, ArrowLeftRight, Sliders, ClipboardList, Clock, Scissors,
  Wrench, FileBarChart, LogOut, ChevronDown, Footprints
} from 'lucide-react';
import { useAuth } from '../App';

const accountsNav = [
  { label: 'Purchase Entry', icon: ShoppingCart, path: '/accounts/purchase-entry' },
  { label: 'Purchase Classification', icon: Tags, path: '/accounts/purchase-classification' },
  { label: 'Purchase Expenses', icon: Package, path: '/accounts/purchase-expenses' },
  { label: 'Vendor Accounts', icon: Users, path: '/accounts/vendors' },
  { label: 'Payments & Receipts', icon: CreditCard, path: '/accounts/payments' },
  { label: 'Credit Management', icon: AlertTriangle, path: '/accounts/credit' },
  { label: 'Cheque Management', icon: FileCheck, path: '/accounts/cheques' },
  { label: 'Accounting', icon: BookOpen, path: '/accounts/accounting' },
  { label: 'Bank Management', icon: Building2, path: '/accounts/bank' },
  { label: 'GST Management', icon: Receipt, path: '/accounts/gst' },
  { label: 'Profit & Loss', icon: TrendingUp, path: '/accounts/pnl' },
  { label: 'Financial Reports', icon: BarChart3, path: '/accounts/reports' },
  { label: 'Capital & Withdrawals', icon: Wallet, path: '/accounts/capital' },
  { label: 'Financial Alerts', icon: Bell, path: '/accounts/alerts' },
];

const inventoryNav = [
  { label: 'Stock Overview', icon: Box, path: '/inventory/stock' },
  { label: 'Size & Colour', icon: Palette, path: '/inventory/size-colour' },
  { label: 'Stock Search', icon: Search, path: '/inventory/search' },
  { label: 'Rack Management', icon: Grid3x3, path: '/inventory/racks' },
  { label: 'Product Catalog', icon: MapPin, path: '/inventory/products' },
  { label: 'Display Stock', icon: Monitor, path: '/inventory/display' },
  { label: 'Stock Transfers', icon: ArrowLeftRight, path: '/inventory/transfers' },
  { label: 'Stock Adjustments', icon: Sliders, path: '/inventory/adjustments' },
  { label: 'Barcode Mgmt', icon: ClipboardList, path: '/inventory/barcodes' },
  { label: 'Stock Valuation', icon: Clock, path: '/inventory/valuation' },
  { label: 'Stock Audit', icon: Scissors, path: '/inventory/audit' },
  { label: 'Damaged Goods', icon: Wrench, path: '/inventory/damaged' },
  { label: 'Low Stock Alerts', icon: Bell, path: '/inventory/low-stock' },
  { label: 'Stock Reports', icon: FileBarChart, path: '/inventory/reports' },
];

export default function Sidebar({ setPageTitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const showAccounts = user?.role === 'admin' || user?.role === 'accounts';
  const showInventory = user?.role === 'admin' || user?.role === 'inventory';

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">👟</div>
        <div className="logo-text">
          <h2>FRMS</h2>
          <p>Footwear Retail Mgmt</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setPageTitle({ title: 'Dashboard', sub: 'Overview' })}
          >
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
        </div>

        {showAccounts && (
          <div className="nav-section">
            <div className="nav-section-title">Accounts Module</div>
            {accountsNav.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setPageTitle({ title: label, sub: 'Accounts Module' })}
              >
                <Icon size={15} /> {label}
              </NavLink>
            ))}
          </div>
        )}

        {showInventory && (
          <div className="nav-section">
            <div className="nav-section-title">Inventory Module</div>
            {inventoryNav.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setPageTitle({ title: label, sub: 'Inventory Module' })}
              >
                <Icon size={15} /> {label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={handleLogout} title="Click to logout">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <strong>{user?.name}</strong>
            <span style={{textTransform:'capitalize'}}>{user?.role} User</span>
          </div>
          <LogOut size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </aside>
  );
}
