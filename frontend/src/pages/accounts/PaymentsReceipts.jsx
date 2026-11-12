import React, { useState, useEffect } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function PaymentsReceipts({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState({ vendor_id:'', type:'payment', amount:'', date:new Date().toISOString().split('T')[0], mode:'NEFT', reference:'', notes:'' });

  useEffect(() => {
    setPageTitle({ title: 'Payments & Receipts', sub: 'Accounts Module' });
    load();
    api.get('/accounts/vendors').then(setVendors);
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/accounts/payments').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const save = async () => {
    await api.post('/accounts/payments', form);
    setModal(false);
    setForm({ vendor_id:'', type:'payment', amount:'', date:new Date().toISOString().split('T')[0], mode:'NEFT', reference:'', notes:'' });
    load();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/accounts/payments/${id}`, { status });
    load();
  };

  const filtered = tab === 'all' ? data : data.filter(d => d.status === tab || d.type === tab);
  const totalPayments = data.filter(d=>d.type==='payment').reduce((s,d)=>s+(d.amount||0),0);
  const totalReceipts = data.filter(d=>d.type==='receipt').reduce((s,d)=>s+(d.amount||0),0);
  const pending = data.filter(d=>d.status==='pending').reduce((s,d)=>s+(d.amount||0),0);

  const columns = [
    { key:'date', label:'Date' },
    { key:'vendor_name', label:'Party' },
    { key:'type', label:'Type', render:v=><span className={`badge ${v==='payment'?'badge-red':'badge-green'}`}>{v}</span> },
    { key:'amount', label:'Amount', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'mode', label:'Mode', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'reference', label:'Reference', render:v=><span style={{fontFamily:'monospace',fontSize:11}}>{v}</span> },
    { key:'status', label:'Status', render:(v,row)=>(
      v==='pending'
        ? <button className="btn btn-success btn-xs" onClick={()=>updateStatus(row.id,'cleared')}>Mark Cleared</button>
        : <span className="badge badge-green">Cleared</span>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Payments & Receipts</h2>
          <p>Unified payment and receipt register</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> Add Entry</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Payments" value={totalPayments} icon={<CreditCard size={20}/>} color="red" prefix="₹" />
        <StatCard label="Total Receipts" value={totalReceipts} icon={<CreditCard size={20}/>} color="green" prefix="₹" />
        <StatCard label="Pending Amount" value={pending} icon={<CreditCard size={20}/>} color="gold" prefix="₹" />
        <StatCard label="Total Entries" value={data.length} icon={<CreditCard size={20}/>} color="blue" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs" style={{flex:1,maxWidth:360}}>
            {['all','payment','receipt','pending'].map(t=>(
              <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={()=>setTab(t)} style={{textTransform:'capitalize'}}>{t}</button>
            ))}
          </div>
          <span className="text-muted text-sm">{filtered.length} entries</span>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="New Payment / Receipt"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Save Entry</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group">
            <label>Vendor / Party</label>
            <select value={form.vendor_id} onChange={e=>setForm({...form,vendor_id:e.target.value})}>
              <option value="">Select party</option>
              {vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              <option value="payment">Payment</option><option value="receipt">Receipt</option>
            </select>
          </div>
          <div className="form-group"><label>Amount (₹)</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
          <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
          <div className="form-group">
            <label>Payment Mode</label>
            <select value={form.mode} onChange={e=>setForm({...form,mode:e.target.value})}>
              {['NEFT','RTGS','Cheque','Cash','UPI'].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Reference No</label><input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} placeholder="REF-001"/></div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></div>
        </div>
      </Modal>
    </div>
  );
}
