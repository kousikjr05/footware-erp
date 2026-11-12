import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { DollarSign } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

ChartJS.register(ArcElement, Tooltip, Legend);

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function StockValuation({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle({ title: 'Stock Valuation', sub: 'Inventory Module' });
    api.get('/inventory/valuation').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalCost = data.reduce((s, d) => s + (d.cost_value || 0), 0);
  const totalMRP = data.reduce((s, d) => s + (d.mrp_value || 0), 0);
  const margin = totalMRP - totalCost;

  const cats = {};
  data.forEach(d => { cats[d.category] = (cats[d.category]||0) + (d.cost_value||0); });
  const catLabels = Object.keys(cats);

  const donutData = {
    labels: catLabels,
    datasets: [{ data:catLabels.map(k=>cats[k]), backgroundColor:['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899'], borderWidth:0 }]
  };

  const columns = [
    { key:'article_no', label:'Article', render:v=><strong style={{fontFamily:'monospace'}}>{v}</strong> },
    { key:'product_name', label:'Product' },
    { key:'category', label:'Category', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'qty', label:'Stock Qty', render:v=><span className="td-num">{v}</span> },
    { key:'cost_price', label:'Cost/Unit', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'mrp', label:'MRP/Unit', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'cost_value', label:'Cost Value', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'mrp_value', label:'MRP Value', render:v=><span className="td-num font-bold">{fmtCur(v)}</span> },
    { key:'id', label:'Margin %', sortable:false, render:(v,row)=>{
      const m = row.mrp>0?((row.mrp-row.cost_price)/row.mrp*100).toFixed(1):0;
      return <span className={`badge ${m>30?'badge-green':m>15?'badge-gold':'badge-red'}`}>{m}%</span>;
    }},
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Stock Valuation</h2>
          <p>Cost-based and MRP-based inventory valuation</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Cost Value" value={totalCost} icon={<DollarSign size={20}/>} color="blue" prefix="₹" />
        <StatCard label="Total MRP Value" value={totalMRP} icon={<DollarSign size={20}/>} color="gold" prefix="₹" />
        <StatCard label="Potential Margin" value={margin} icon={<DollarSign size={20}/>} color="green" prefix="₹" />
        <StatCard label="Avg Margin" value={totalMRP>0?((margin/totalMRP)*100).toFixed(1):0} icon={<DollarSign size={20}/>} color="purple" suffix="%" />
      </div>

      <div className="two-col" style={{marginBottom:20}}>
        <div className="card">
          <div className="card-header"><div className="card-title">Valuation by Category</div></div>
          <div style={{height:220}}><Doughnut data={donutData} options={{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'right',labels:{color:'#9CA3AF',font:{size:11}}}}}}/></div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Valuation Summary</div></div>
          <div>
            {catLabels.map(cat=>(
              <div key={cat} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                <span>{cat}</span>
                <div style={{display:'flex',gap:24}}>
                  <span style={{color:'var(--text-muted)',width:100,textAlign:'right'}}>Cost: {fmtCur(cats[cat])}</span>
                  <div className="progress-bar" style={{width:80}}>
                    <div className="progress-fill blue" style={{width:`${Math.round(cats[cat]/totalCost*100)}%`}}/>
                  </div>
                  <span style={{width:35,fontSize:11,color:'var(--text-muted)'}}>{Math.round(cats[cat]/totalCost*100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Product-wise Valuation</div></div>
        <DataTable columns={columns} data={data} loading={loading} />
      </div>
    </div>
  );
}
