import React, { useState, useEffect } from 'react';
import { Plus, Monitor } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function DisplayStock({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ product_id:'', display_area:'Showroom Front', qty:'' });

  useEffect(() => {
    setPageTitle({ title: 'Display Stock', sub: 'Inventory Module' });
    load();
    api.get('/inventory/products').then(setProducts);
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/inventory/display-stock').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const save = async () => {
    await api.post('/inventory/display-stock', form);
    setModal(false);
    setForm({ product_id:'', display_area:'Showroom Front', qty:'' });
    load();
  };

  const areas = [...new Set(data.map(d => d.display_area))];
  const totalDisplay = data.reduce((s, d) => s + (d.qty || 0), 0);

  const columns = [
    { key:'article_no', label:'Article No', render:v=><strong style={{fontFamily:'monospace'}}>{v}</strong> },
    { key:'product_name', label:'Product' },
    { key:'brand', label:'Brand', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'display_area', label:'Display Area', render:v=><span className="badge badge-purple">{v}</span> },
    { key:'qty', label:'Display Qty', render:v=><span className="td-num">{v}</span> },
    { key:'mrp', label:'MRP', render:v=><span className="td-num">{fmtCur(v)}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Display Stock</h2>
          <p>Showroom and display area stock placement</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={14}/> Add Display</button>
      </div>

      <div className="stat-grid">
        <StatCard label="On Display" value={totalDisplay} icon={<Monitor size={20}/>} color="blue" />
        <StatCard label="Display Areas" value={areas.length} icon={<Monitor size={20}/>} color="purple" />
        <StatCard label="Products Displayed" value={data.length} icon={<Monitor size={20}/>} color="green" />
        <StatCard label="Display Value" value={data.reduce((s,d)=>s+(d.qty||0)*(d.mrp||0),0)} icon={<Monitor size={20}/>} color="gold" prefix="₹" />
      </div>

      <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
        {areas.map(area => {
          const areaItems = data.filter(d=>d.display_area===area);
          return (
            <div className="card" key={area} style={{flex:1,minWidth:200}}>
              <div className="card-title" style={{marginBottom:12}}>{area}</div>
              <div style={{fontSize:24,fontWeight:800,color:'var(--accent)',marginBottom:4}}>{areaItems.reduce((s,d)=>s+(d.qty||0),0)} pcs</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>{areaItems.length} products</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Display Stock Register</div></div>
        <DataTable columns={columns} data={data} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Display Stock"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Save</button></>}>
        <div className="form-grid" style={{gap:14}}>
          <div className="form-group">
            <label>Product</label>
            <select value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})}>
              <option value="">Select product</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.article_no} — {p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Display Area</label>
            <select value={form.display_area} onChange={e=>setForm({...form,display_area:e.target.value})}>
              {['Showroom Front','Window Display','Center Rack','Premium Section','Clearance Corner','Kids Section'].map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Quantity</label><input type="number" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} placeholder="0"/></div>
        </div>
      </Modal>
    </div>
  );
}
