import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { TrendingUp } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { api } from '../../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const pct = (n, d) => d ? ((n/d)*100).toFixed(1) : 0;

export default function ProfitLoss({ setPageTitle }) {
  const [pnl, setPnl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle({ title: 'Profit & Loss', sub: 'Accounts Module' });
    api.get('/accounts/pnl').then(d => { setPnl(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/><span>Loading P&L...</span></div>;
  if (!pnl) return null;

  const chartData = {
    labels: ['Sales', 'COGS', 'Gross Profit', 'Operating Expenses', 'Net Profit'],
    datasets: [{
      data: [pnl.sales, pnl.cogs, pnl.grossProfit, pnl.totalExpenses, pnl.netProfit],
      backgroundColor: ['#3B82F6','#EF4444','#10B981','#F59E0B',pnl.netProfit>=0?'#10B981':'#EF4444'],
      borderRadius: 8,
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color:'#9CA3AF' }, grid: { display: false } },
      y: { ticks: { color:'#9CA3AF', callback: v => '₹'+v.toLocaleString('en-IN') }, grid: { color:'rgba(255,255,255,0.04)' } }
    }
  };

  const Row = ({ label, value, indent=0, bold=false, color='' }) => (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)', paddingLeft:indent*20, fontSize:13 }}>
      <span style={{ color: bold?'var(--text)':'var(--text-sec)', fontWeight: bold?700:400 }}>{label}</span>
      <span style={{ fontWeight:700, fontFamily:'monospace', color: color||'var(--text)' }}>{fmtCur(value)}</span>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Profit & Loss</h2>
          <p>Revenue, COGS, expenses and profit calculation</p>
        </div>
        <span className="badge badge-blue" style={{fontSize:12}}>FY 2024-25</span>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Revenue" value={pnl.totalRevenue} icon={<TrendingUp size={20}/>} color="blue" prefix="₹" />
        <StatCard label="Gross Profit" value={pnl.grossProfit} icon={<TrendingUp size={20}/>} color="green" prefix="₹" badge={`${pct(pnl.grossProfit,pnl.totalRevenue)}%`} badgeType="up" />
        <StatCard label="Net Profit" value={pnl.netProfit} icon={<TrendingUp size={20}/>} color={pnl.netProfit>=0?'green':'red'} prefix="₹" badge={`${pct(pnl.netProfit,pnl.totalRevenue)}%`} badgeType={pnl.netProfit>=0?'up':'down'} />
        <StatCard label="Expense Ratio" value={pct(pnl.totalExpenses,pnl.totalRevenue)} icon={<TrendingUp size={20}/>} color="gold" suffix="%" />
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header"><div className="card-title">P&L Statement</div><span className="badge badge-green">Current Period</span></div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:'var(--text-muted)', padding:'8px 0', borderBottom:'2px solid var(--border)' }}>REVENUE</div>
            <Row label="Sales — Footwear" value={pnl.sales} indent={1} />
            <Row label="Other Income" value={pnl.otherIncome} indent={1} />
            <Row label="Total Revenue" value={pnl.totalRevenue} bold color="var(--accent)" />
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:'var(--text-muted)', padding:'12px 0 8px' }}>COST OF GOODS SOLD</div>
            <Row label="Purchase — Footwear" value={pnl.purchases_cost} indent={1} />
            <Row label="Freight Charges" value={pnl.freight} indent={1} />
            <Row label="Total COGS" value={pnl.cogs} bold />
            <Row label="Gross Profit" value={pnl.grossProfit} bold color="var(--success)" />
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:'var(--text-muted)', padding:'12px 0 8px' }}>OPERATING EXPENSES</div>
            <Row label="Rent" value={pnl.rent} indent={1} />
            <Row label="Salaries" value={pnl.salaries} indent={1} />
            <Row label="Electricity" value={pnl.electricity} indent={1} />
            <Row label="Total Expenses" value={pnl.totalExpenses} bold />
            <div style={{ padding:'12px 0', borderTop:'2px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontWeight:800, fontSize:15 }}>NET PROFIT</span>
              <span style={{ fontWeight:800, fontSize:15, color: pnl.netProfit>=0?'var(--success)':'var(--danger)' }}>{fmtCur(pnl.netProfit)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Visual Overview</div></div>
          <div className="chart-wrap-lg">
            <Bar data={chartData} options={chartOpts} />
          </div>
          <div style={{ marginTop:16, padding:16, background:'var(--bg-secondary)', borderRadius:8 }}>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>Key Ratios</div>
            {[
              ['Gross Margin', `${pct(pnl.grossProfit,pnl.totalRevenue)}%`, 'green'],
              ['Net Margin', `${pct(pnl.netProfit,pnl.totalRevenue)}%`, pnl.netProfit>=0?'green':'red'],
              ['Expense Ratio', `${pct(pnl.totalExpenses,pnl.totalRevenue)}%`, 'gold'],
            ].map(([label,val,color])=>(
              <div key={label} style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:13}}>
                <span style={{color:'var(--text-muted)'}}>{label}</span>
                <strong style={{color:`var(--${color==='red'?'danger':color==='gold'?'warning':'success'})`}}>{val}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
