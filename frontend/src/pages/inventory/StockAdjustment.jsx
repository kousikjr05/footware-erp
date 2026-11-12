import React, { useState, useEffect } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

export default function StockAdjustment({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ product_name:'', adjustment_type:'increase', qty:'', reason:'Physical Count', notes:'' });

  useEffect(() => {
    setPageTitle({ title: 'Stock Adjustment', sub: 'Inventory Module' });
    load();
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/inventory/adjustments').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const save = async () => {
    await api.post('/inventory/adjustments', form);
    setModal(false);
    setForm({ product_name:'', adjustment_type:'increase', qty:'', reason:'Physical Count', notes:'' });
    load();
  };

  const totalInc = data.filter(d=>d.adjustment_type==='increase').reduce((s,d)=>s+(d.qty||0),0);
  const totalDec = data.filter(d=>d.adjustment_type==='decrease').reduce((s,d)=>s+(d.qty||0),0);

  const columns = [
    { key:'date', label:'Date' },
    { key:'product_name', label:'Product', render:v=><strong>{v}</strong> },
    { key:'adjustment_type', label:'Type', render:v=><span className={`badge ${v==='increase'?'badge-green':'badge-red'}`}>{v==='increase'?'↑ Increase':'↓ Decrease'}</span> },
    { key:'qty', label:'Qty', render:(v,row)=><span className={`td-num ${row.adjustment_type==='increase'?'text-success':'text-danger'}`}>{row.adjustment_type==='increase'?'+':'-'}{v}</span> },
    { key:'reason', label:'Reason', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'notes', label:'Notes', render:v=><span className="text-muted">{v||'—'}</span> },
    { key:'status', label:'Status', render:v=><span className={`badge ${v==='approved'?'badge-green':'badge-gold'}`}>{v}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Stock Adjustment</h2>
          <p>Manual stock increases, decreases and corrections</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> New Adjustment</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Adjustments" value={data.length} icon={<SlidersHorizontal size={20}/>} color="blue" />
        <StatCard label="Total Increased" value={totalInc} icon={<SlidersHorizontal size={20}/>} color="green" badge={`+${totalInc}`} badgeType="up" />
        <StatCard label="Total Decreased" value={totalDec} icon={<SlidersHorizontal size={20}/>} color="red" badge={`-${totalDec}`} badgeType="down" />
        <StatCard label="Pending Approval" value={data.filter(d=>d.status==='pending').length} icon={<SlidersHorizontal size={20}/>} color="gold" />
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Adjustment History</div></div>
        <DataTable columns={columns} data={data} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="New Stock Adjustment"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Submit</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group"><label>Product</label><input value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} placeholder="Product name"/></div>
          <div className="form-group">
            <label>Adjustment Type</label>
            <select value={form.adjustment_type} onChange={e=>setForm({...form,adjustment_type:e.target.value})}>
              <option value="increase">Increase</option><option value="decrease">Decrease</option>
            </select>
          </div>
          <div className="form-group"><label>Quantity</label><input type="number" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} placeholder="0"/></div>
          <div className="form-group">
            <label>Reason</label>
            <select value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}>
              {['Physical Count','Damaged','Returned','System Error','Theft','Shrinkage'].map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></div>
        </div>
      </Modal>
    </div>
  );
}
