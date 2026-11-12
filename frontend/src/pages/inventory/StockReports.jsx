import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { BarChart3, Download } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function StockReports({ setPageTitle }) {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('summary');

  useEffect(() => {
    setPageTitle({ title: 'Stock Reports', sub: 'Inventory Module' });
    setLoading(true);
    Promise.all([api.get('/inventory/products'), api.get('/inventory/stock/summary')])
      .then(([p, s]) => { setProducts(p); setSummary(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cats = summary?.categories || [];
  const barData = {
    labels: cats.map(c=>c.category),
    datasets: [
      { label:'Quantity', data:cats.map(c=>c.qty), backgroundColor:'rgba(59,130,246,0.7)', borderRadius:6 },
    ]
  };
  const barOpts = { responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#9CA3AF'}}}, scales:{x:{ticks:{color:'#9CA3AF'}},y:{ticks:{color:'#9CA3AF'},grid:{color:'rgba(255,255,255,0.04)'}}} };

  const columns = [
    { key:'article_no', label:'Article', render:v=><strong style={{fontFamily:'monospace'}}>{v}</strong> },
    { key:'name', label:'Product' },
    { key:'brand', label:'Brand', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'category', label:'Category', render:v=><span className="badge badge-purple">{v}</span> },
    { key:'total_stock', label:'Stock', render:v=><span className="td-num">{v}</span> },
    { key:'cost_price', label:'Cost', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'mrp', label:'MRP', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'id', label:'Stock Value', sortable:false, render:(v,row)=><span className="td-num">{fmtCur((row.total_stock||0)*(row.cost_price||0))}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Stock Reports</h2>
          <p>Comprehensive inventory reports and analytics</p>
        </div>
        <button className="btn btn-ghost btn-sm"><Download size={14}/> Export CSV</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Products" value={products.length} icon={<BarChart3 size={20}/>} color="blue" />
        <StatCard label="Total Stock" value={summary?.total||0} icon={<BarChart3 size={20}/>} color="green" />
        <StatCard label="Stock Value" value={summary?.value||0} icon={<BarChart3 size={20}/>} color="gold" prefix="₹" />
        <StatCard label="Categories" value={cats.length} icon={<BarChart3 size={20}/>} color="purple" />
      </div>

      <div className="tabs" style={{maxWidth:300}}>
        <button className={`tab-btn ${tab==='summary'?'active':''}`} onClick={()=>setTab('summary')}>Summary</button>
        <button className={`tab-btn ${tab==='detail'?'active':''}`} onClick={()=>setTab('detail')}>Product Detail</button>
      </div>

      {tab==='summary' && (
        <div className="two-col">
          <div className="card">
            <div className="card-header"><div className="card-title">Stock by Category</div></div>
            <div style={{height:240}}><Bar data={barData} options={barOpts}/></div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Category Summary</div></div>
            {cats.map(c=>(
              <div key={c.category} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                <span><strong>{c.category}</strong></span>
                <div style={{display:'flex',gap:20}}>
                  <span className="text-muted">{c.qty} units</span>
                  <strong>{fmtCur(c.val)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='detail' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Product Inventory Report</div><span className="text-muted text-sm">{products.length} products</span></div>
          <DataTable columns={columns} data={products} loading={loading} />
        </div>
      )}
    </div>
  );
}
