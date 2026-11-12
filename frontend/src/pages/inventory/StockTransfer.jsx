import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeftRight } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

export default function StockTransfer({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ from_rack:'', to_rack:'', product_name:'', qty:'', reason:'Restock', notes:'' });

  useEffect(() => {
    setPageTitle({ title: 'Stock Transfer', sub: 'Inventory Module' });
    load();
    api.get('/inventory/racks').then(setRacks);
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/inventory/transfers').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const save = async () => {
    await api.post('/inventory/transfers', form);
    setModal(false);
    setForm({ from_rack:'', to_rack:'', product_name:'', qty:'', reason:'Restock', notes:'' });
    load();
  };

  const columns = [
    { key:'date', label:'Date' },
    { key:'product_name', label:'Product', render:v=><strong>{v}</strong> },
    { key:'from_rack', label:'From', render:v=><span className="badge badge-red">📍 {v}</span> },
    { key:'to_rack', label:'To', render:v=><span className="badge badge-green">📍 {v}</span> },
    { key:'qty', label:'Qty', render:v=><span className="td-num">{v}</span> },
    { key:'reason', label:'Reason', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'status', label:'Status', render:v=><span className={`badge ${v==='completed'?'badge-green':'badge-gold'}`}>{v}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Stock Transfer</h2>
          <p>Move stock between racks, floors and departments</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> New Transfer</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Transfers" value={data.length} icon={<ArrowLeftRight size={20}/>} color="blue" />
        <StatCard label="Units Moved" value={data.reduce((s,d)=>s+(d.qty||0),0)} icon={<ArrowLeftRight size={20}/>} color="green" />
        <StatCard label="Pending" value={data.filter(d=>d.status==='pending').length} icon={<ArrowLeftRight size={20}/>} color="gold" />
        <StatCard label="Completed" value={data.filter(d=>d.status==='completed').length} icon={<ArrowLeftRight size={20}/>} color="green" />
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Transfer History</div></div>
        <DataTable columns={columns} data={data} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="New Stock Transfer"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Transfer</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group"><label>Product</label><input value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} placeholder="Product name"/></div>
          <div className="form-group"><label>Quantity</label><input type="number" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} placeholder="0"/></div>
          <div className="form-group">
            <label>From Rack</label>
            <select value={form.from_rack} onChange={e=>setForm({...form,from_rack:e.target.value})}>
              <option value="">Select source</option>
              {racks.map(r=><option key={r.id} value={r.rack_no}>{r.rack_no} ({r.department})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>To Rack</label>
            <select value={form.to_rack} onChange={e=>setForm({...form,to_rack:e.target.value})}>
              <option value="">Select destination</option>
              {racks.map(r=><option key={r.id} value={r.rack_no}>{r.rack_no} ({r.department})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <select value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}>
              {['Restock','Display Refresh','Season Change','Clearance','Reorganize'].map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Notes</label><input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional notes"/></div>
        </div>
      </Modal>
    </div>
  );
}
