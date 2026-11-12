import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { ShoppingCart, Users, Package, AlertTriangle, TrendingUp, FileCheck, Box, Wrench } from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../api';
import { useAuth } from '../App';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const chartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#9CA3AF', font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: '#6B7280' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#6B7280' }, grid: { color: 'rgba(255,255,255,0.04)' } }
  }
};

const doughnutOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'right', labels: { color: '#9CA3AF', font: { size: 11 }, padding: 12 } } },
  cutout: '65%'
};

const fmt = n => typeof n === 'number' ? n.toLocaleString('en-IN') : n;
const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Dashboard({ setPageTitle }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setPageTitle({ title: 'Dashboard', sub: 'Business Overview' });
    api.get('/dashboard/stats').then(setStats).catch(console.error);
  }, []);

  const barData = {
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Purchases (₹)',
      data: [820000, 1240000, 980000, 1560000, 1120000, 1890000],
      backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 6,
    }]
  };

  const donutData = {
    labels: ['Sports', 'Formal', 'Casual', 'Ladies', 'Kids', 'Sandals'],
    datasets: [{
      data: [28, 22, 20, 15, 10, 5],
      backgroundColor: ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4'],
      borderWidth: 0,
    }]
  };

  const showAccounts = user?.role === 'admin' || user?.role === 'accounts';
  const showInventory = user?.role === 'admin' || user?.role === 'inventory';

  return (
    <div>
      <div className="dashboard-welcome">
        <h2>Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
        <p>Here's your business overview for today — {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
      </div>

      {showAccounts && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:3, height:18, background:'var(--accent)', borderRadius:2 }}/>
            <h3 style={{ fontSize:14, fontWeight:600, color:'var(--text-sec)' }}>ACCOUNTS OVERVIEW</h3>
          </div>
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <StatCard label="Total Vendors" value={stats?.totalVendors || 15} icon={<Users size={20}/>} color="blue" />
            <StatCard label="Total Purchases" value={stats?.totalPurchases || 0} icon={<ShoppingCart size={20}/>} color="gold" prefix="₹" badge="↑12%" badgeType="up" />
            <StatCard label="Pending Payments" value={stats?.pendingPayments || 0} icon={<FileCheck size={20}/>} color="purple" prefix="₹" />
            <StatCard label="Overdue Vendors" value={stats?.overdueVendors || 3} icon={<AlertTriangle size={20}/>} color="red" />
          </div>
        </>
      )}

      {showInventory && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:3, height:18, background:'var(--gold)', borderRadius:2 }}/>
            <h3 style={{ fontSize:14, fontWeight:600, color:'var(--text-sec)' }}>INVENTORY OVERVIEW</h3>
          </div>
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <StatCard label="Total Products" value={stats?.totalProducts || 20} icon={<Package size={20}/>} color="green" />
            <StatCard label="Total Stock Units" value={stats?.totalStock || 0} icon={<Box size={20}/>} color="blue" />
            <StatCard label="Low Stock Items" value={stats?.lowStock || 0} icon={<AlertTriangle size={20}/>} color="gold" />
            <StatCard label="Damaged (Pending)" value={stats?.damagedGoods || 0} icon={<Wrench size={20}/>} color="red" />
          </div>
        </>
      )}

      {user?.role === 'admin' && (
        <div className="two-col">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Purchase Trend</div>
                <div className="card-subtitle">Last 6 months</div>
              </div>
            </div>
            <div className="chart-wrap">
              <Bar data={barData} options={chartOpts} />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Stock by Category</div>
                <div className="card-subtitle">Distribution overview</div>
              </div>
            </div>
            <div className="chart-wrap">
              <Doughnut data={donutData} options={doughnutOpts} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
