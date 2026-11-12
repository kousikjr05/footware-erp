import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function DamagedGoods({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ product_name:'', qty:'', damage_type:'Manufacturing Defect', severity:'medium', action:'return', loss_amount:'', notes:'' });

  useEffect(() => {
    setPageTitle({ title: 'Damaged Goods', sub: 'Inventory Module' });
    load();
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/inventory/damaged').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const save = async () => {
    await api.post('/inventory/damaged', form);
    setModal(false);
    setForm({ product_name:'', qty:'', damage_type:'Manufacturing Defect', severity:'medium', action:'return', loss_amount:'', notes:'' });
    load();
  };

  const totalLoss = data.reduce((s,d)=>s+(d.loss_amount||0),0);

  const columns = [
    { key:'date', label:'Date' },
    { key:'product_name', label:'Product', render:v=><strong>{v}</strong> },
    { key:'qty', label:'Qty', render:v=><span className="td-num">{v}</span> },
    { key:'damage_type', label:'Damage Type', render:v=><span className="badge badge-red">{v}</span> },
    { key:'severity', label:'Severity', render:v=>{
      const map = {low:'badge-green', medium:'badge-gold', high:'badge-red'};
      return <span className={`badge ${map[v]}`}>{v}</span>;
    }},
    { key:'action', label:'Action', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'loss_amount', label:'Loss', render:v=><span className="td-num text-danger">{fmtCur(v)}</span> },
    { key:'status', label:'Status', render:v=><span className={`badge ${v==='resolved'?'badge-green':'badge-gold'}`}>{v}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Damaged Goods</h2>
          <p>Track damaged, defective and return inventory</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> Report Damage</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Reports" value={data.length} icon={<Trash2 size={20}/>} color="red" />
        <StatCard label="Units Damaged" value={data.reduce((s,d)=>s+(d.qty||0),0)} icon={<Trash2 size={20}/>} color="gold" />
        <StatCard label="Total Loss" value={totalLoss} icon={<Trash2 size={20}/>} color="red" prefix="₹" />
        <StatCard label="Pending" value={data.filter(d=>d.status==='pending').length} icon={<Trash2 size={20}/>} color="gold" />
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Damaged Goods Register</div></div>
        <DataTable columns={columns} data={data} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Report Damaged Goods"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Submit Report</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group"><label>Product</label><input value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} placeholder="Product name"/></div>
          <div className="form-group"><label>Quantity</label><input type="number" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/></div>
          <div className="form-group">
            <label>Damage Type</label>
            <select value={form.damage_type} onChange={e=>setForm({...form,damage_type:e.target.value})}>
              {['Manufacturing Defect','Transit Damage','Storage Damage','Water Damage','Sole Separation','Colour Fade'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Severity</label>
            <select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Action</label>
            <select value={form.action} onChange={e=>setForm({...form,action:e.target.value})}>
              {['return','write-off','repair','discount'].map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Loss Amount (₹)</label><input type="number" value={form.loss_amount} onChange={e=>setForm({...form,loss_amount:e.target.value})}/></div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></div>
        </div>
      </Modal>
    </div>
  );
}
