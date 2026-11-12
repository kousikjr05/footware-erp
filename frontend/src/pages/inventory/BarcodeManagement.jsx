import React, { useState, useEffect } from 'react';
import { Barcode, Printer } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

export default function BarcodeManagement({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selPrint, setSelPrint] = useState([]);

  useEffect(() => {
    setPageTitle({ title: 'Barcode Management', sub: 'Inventory Module' });
    api.get('/inventory/barcodes').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggleSelect = id => {
    setSelPrint(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  };

  const columns = [
    { key:'id', label:'', sortable:false, render:v=>(
      <input type="checkbox" checked={selPrint.includes(v)} onChange={()=>toggleSelect(v)} style={{accentColor:'var(--accent)'}}/>
    )},
    { key:'barcode', label:'Barcode', render:v=>(
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ fontFamily:'monospace', fontSize:18, letterSpacing:4, fontWeight:700 }}>{v}</div>
      </div>
    )},
    { key:'article_no', label:'Article', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'product_name', label:'Product', render:v=><strong>{v}</strong> },
    { key:'size', label:'Size' },
    { key:'colour', label:'Colour' },
    { key:'mrp', label:'MRP', render:v=><span className="td-num">₹{v}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Barcode Management</h2>
          <p>Generate, view and print barcodes for all product variants</p>
        </div>
        <div className="page-header-actions">
          {selPrint.length > 0 && (
            <button className="btn btn-primary btn-sm" onClick={()=>alert(`Printing ${selPrint.length} barcodes...`)}>
              <Printer size={14}/> Print {selPrint.length} Barcodes
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={()=>setSelPrint(data.map(d=>d.id))}>Select All</button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Barcodes" value={data.length} icon={<Barcode size={20}/>} color="blue" />
        <StatCard label="Products" value={new Set(data.map(d=>d.article_no)).size} icon={<Barcode size={20}/>} color="green" />
        <StatCard label="Selected" value={selPrint.length} icon={<Printer size={20}/>} color="gold" />
        <StatCard label="Unique Sizes" value={new Set(data.map(d=>d.size)).size} icon={<Barcode size={20}/>} color="purple" />
      </div>

      {selPrint.length > 0 && (
        <div style={{ marginBottom:20, padding:16, background:'var(--bg-secondary)', borderRadius:12, border:'1px solid var(--border)' }}>
          <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Print Preview — {selPrint.length} labels</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
            {data.filter(d=>selPrint.includes(d.id)).slice(0,12).map(d => (
              <div key={d.id} style={{ background:'white', borderRadius:8, padding:'10px 12px', color:'#111', textAlign:'center', fontSize:11 }}>
                <div style={{fontFamily:'monospace',fontSize:16,letterSpacing:3,fontWeight:800,marginBottom:4}}>{d.barcode}</div>
                <div style={{fontWeight:600}}>{d.article_no}</div>
                <div style={{color:'#666'}}>{d.size} · {d.colour}</div>
                <div style={{fontWeight:700,marginTop:2}}>MRP ₹{d.mrp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title">Barcode Register</div><span className="text-muted text-sm">{data.length} barcodes</span></div>
        <DataTable columns={columns} data={data} loading={loading} />
      </div>
    </div>
  );
}
