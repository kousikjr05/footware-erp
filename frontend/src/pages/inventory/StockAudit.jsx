import React, { useState, useEffect } from 'react';
import { Plus, ClipboardCheck } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

export default function StockAudit({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ product_name:'', system_qty:'', physical_qty:'', rack:'', notes:'' });

  useEffect(() => {
    setPageTitle({ title: 'Stock Audit', sub: 'Inventory Module' });
    load();
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/inventory/audit').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const save = async () => {
    await api.post('/inventory/audit', { ...form, variance: (form.physical_qty||0) - (form.system_qty||0) });
    setModal(false);
    setForm({ product_name:'', system_qty:'', physical_qty:'', rack:'', notes:'' });
    load();
  };

  const matched = data.filter(d=>d.variance===0).length;
  const mismatched = data.filter(d=>d.variance!==0).length;
  const totalVariance = data.reduce((s,d)=>s+Math.abs(d.variance||0),0);

  const columns = [
    { key:'date', label:'Date' },
    { key:'product_name', label:'Product', render:v=><strong>{v}</strong> },
    { key:'rack', label:'Rack', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'system_qty', label:'System Qty', render:v=><span className="td-num">{v}</span> },
    { key:'physical_qty', label:'Physical Qty', render:v=><span className="td-num">{v}</span> },
    { key:'variance', label:'Variance', render:v=>{
      if (v===0) return <span className="badge badge-green">✓ Match</span>;
      return <span className={`badge ${v>0?'badge-green':'badge-red'}`}>{v>0?'+':''}{v}</span>;
    }},
    { key:'status', label:'Status', render:v=><span className={`badge ${v==='resolved'?'badge-green':'badge-gold'}`}>{v}</span> },
    { key:'notes', label:'Notes', render:v=><span className="text-muted">{v||'—'}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Stock Audit</h2>
          <p>Physical count verification and variance tracking</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> New Audit Entry</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Audits" value={data.length} icon={<ClipboardCheck size={20}/>} color="blue" />
        <StatCard label="Matched" value={matched} icon={<ClipboardCheck size={20}/>} color="green" />
        <StatCard label="Mismatched" value={mismatched} icon={<ClipboardCheck size={20}/>} color="red" />
        <StatCard label="Total Variance" value={totalVariance} icon={<ClipboardCheck size={20}/>} color="gold" suffix=" units" />
      </div>

      <div style={{ marginBottom:20, padding:16, borderRadius:12, background:mismatched>0?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)', border:`1px solid ${mismatched>0?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}` }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:12,color:'var(--text-muted)'}}>Audit Accuracy</div>
            <div style={{fontSize:28,fontWeight:800,color:mismatched>0?'var(--danger)':'var(--success)'}}>
              {data.length>0?((matched/data.length)*100).toFixed(1):100}%
            </div>
          </div>
          <div style={{display:'flex',gap:16}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:700,color:'var(--success)'}}>{matched}</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>Matched</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:700,color:'var(--danger)'}}>{mismatched}</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>Mismatched</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Audit Records</div></div>
        <DataTable columns={columns} data={data} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="New Audit Entry"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Submit</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group"><label>Product</label><input value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} placeholder="Product name"/></div>
          <div className="form-group"><label>Rack</label><input value={form.rack} onChange={e=>setForm({...form,rack:e.target.value})} placeholder="R-01"/></div>
          <div className="form-group"><label>System Qty</label><input type="number" value={form.system_qty} onChange={e=>setForm({...form,system_qty:parseInt(e.target.value)||0})} placeholder="0"/></div>
          <div className="form-group"><label>Physical Qty</label><input type="number" value={form.physical_qty} onChange={e=>setForm({...form,physical_qty:parseInt(e.target.value)||0})} placeholder="0"/></div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></div>
        </div>
      </Modal>
    </div>
  );
}
