import React, { useState, useEffect } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Box, TrendingDown, AlertTriangle, Package } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { api } from '../../api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function StockOverview({ setPageTitle }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle({ title: 'Stock Overview', sub: 'Inventory Module' });
    api.get('/inventory/stock/summary').then(d => { setSummary(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/><span>Loading stock data...</span></div>;
  if (!summary) return null;

  const cats = summary.categories || [];
  const doughnutData = {
    labels: cats.map(c=>c.category),
    datasets: [{
      data: cats.map(c=>c.qty),
      backgroundColor: ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899'],
      borderWidth: 0,
    }]
  };

  const barData = {
    labels: cats.map(c=>c.category),
    datasets: [{
      label: 'Stock Value (₹)',
      data: cats.map(c=>c.val),
      backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 6,
    }]
  };

  const chartOpts = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ticks:{color:'#9CA3AF'}}, y:{ticks:{color:'#9CA3AF',callback:v=>'₹'+v.toLocaleString('en-IN')},grid:{color:'rgba(255,255,255,0.04)'}} } };
  const donutOpts = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ color:'#9CA3AF', font:{size:11} } } }, cutout:'65%' };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Stock Overview</h2>
          <p>Real-time stock levels, value and availability</p>
        </div>
        <span className="badge badge-green" style={{fontSize:12}}>Live</span>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Stock Units" value={summary.total} icon={<Box size={20}/>} color="blue" />
        <StatCard label="Stock Value (Cost)" value={summary.value} icon={<Package size={20}/>} color="gold" prefix="₹" />
        <StatCard label="Low Stock SKUs" value={summary.lowStock} icon={<AlertTriangle size={20}/>} color="gold" />
        <StatCard label="Out of Stock SKUs" value={summary.outOfStock} icon={<TrendingDown size={20}/>} color="red" />
      </div>

      <div className="two-col" style={{ marginBottom:20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Stock by Category</div></div>
          <div style={{ height:220 }}><Doughnut data={doughnutData} options={donutOpts} /></div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Stock Value by Category</div></div>
          <div style={{ height:220 }}><Bar data={barData} options={chartOpts} /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Category Breakdown</div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Category</th><th>Products</th><th>Total Units</th><th>Stock Value</th><th>Share</th></tr></thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.category}>
                  <td><strong>{c.category}</strong></td>
                  <td>{c.products || '—'}</td>
                  <td><span className="td-num">{c.qty?.toLocaleString('en-IN')}</span></td>
                  <td><span className="td-num">{fmtCur(c.val)}</span></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="progress-bar" style={{ flex:1 }}>
                        <div className="progress-fill blue" style={{ width:`${Math.round((c.qty/summary.total)*100)}%` }}/>
                      </div>
                      <span style={{ fontSize:11, color:'var(--text-muted)', width:35 }}>{Math.round((c.qty/summary.total)*100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
