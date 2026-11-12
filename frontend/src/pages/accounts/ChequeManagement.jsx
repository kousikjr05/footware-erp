import React, { useState, useEffect } from 'react';
import { Plus, FileCheck } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function ChequeManagement({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState({ vendor_id:'', type:'payment', amount:'', cheque_no:'', bank:'SBI', due_date:'' });

  useEffect(() => {
    setPageTitle({ title: 'Cheque Management', sub: 'Accounts Module' });
    load();
    api.get('/accounts/vendors').then(setVendors);
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/accounts/cheques').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const updateStatus = async (id, status, extraData = {}) => {
    await api.put(`/accounts/cheques/${id}`, { status, clearing_date: new Date().toISOString().split('T')[0], ...extraData });
    load();
  };

  const save = async () => {
    await api.post('/accounts/cheques', form);
    setModal(false);
    setForm({ vendor_id:'', type:'payment', amount:'', cheque_no:'', bank:'SBI', due_date:'' });
    load();
  };

  const filtered = tab==='all'?data:data.filter(d=>d.status===tab);
  const totalAmt = filtered.reduce((s,d)=>s+(d.amount||0),0);

  const statusBadge = s => {
    const map = { pending:'badge-gold', cleared:'badge-green', bounced:'badge-red' };
    const icons = { pending:'⏳', cleared:'✅', bounced:'❌' };
    return <span className={`badge ${map[s]||'badge-gray'}`}>{icons[s]} {s}</span>;
  };

  const columns = [
    { key:'cheque_no', label:'Cheque No', render:v=><strong style={{fontFamily:'monospace'}}>{v}</strong> },
    { key:'vendor_name', label:'Vendor' },
    { key:'bank', label:'Bank', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'amount', label:'Amount', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'due_date', label:'Due Date', render:(v,row)=>{
      const isOverdue = new Date(v) < new Date() && row.status==='pending';
      return <span style={{color:isOverdue?'var(--danger)':''}}>{isOverdue?'⚠️ ':''}{v}</span>;
    }},
    { key:'status', label:'Status', render:v=>statusBadge(v) },
    { key:'id', label:'Actions', sortable:false, render:(v,row)=> row.status==='pending' ? (
      <div style={{display:'flex',gap:6}}>
        <button className="btn btn-success btn-xs" onClick={()=>updateStatus(v,'cleared')}>Clear</button>
        <button className="btn btn-danger btn-xs" onClick={()=>updateStatus(v,'bounced',{bounce_reason:'Insufficient funds'})}>Bounce</button>
      </div>
    ) : null},
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Cheque Management</h2>
          <p>Track cheque entry, clearing, bounce and due dates</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> Add Cheque</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Cheques" value={data.length} icon={<FileCheck size={20}/>} color="blue" />
        <StatCard label="Pending" value={data.filter(d=>d.status==='pending').length} icon={<FileCheck size={20}/>} color="gold" />
        <StatCard label="Cleared" value={data.filter(d=>d.status==='cleared').length} icon={<FileCheck size={20}/>} color="green" />
        <StatCard label="Bounced" value={data.filter(d=>d.status==='bounced').length} icon={<FileCheck size={20}/>} color="red" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs" style={{flex:1,maxWidth:400}}>
            {['all','pending','cleared','bounced'].map(t=>(
              <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={()=>setTab(t)} style={{textTransform:'capitalize'}}>{t}</button>
            ))}
          </div>
          <span className="text-muted text-sm">{filtered.length} cheques · {fmtCur(totalAmt)}</span>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Cheque Entry"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Save</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group">
            <label>Vendor</label>
            <select value={form.vendor_id} onChange={e=>setForm({...form,vendor_id:e.target.value})}>
              <option value="">Select vendor</option>
              {vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Cheque No</label><input value={form.cheque_no} onChange={e=>setForm({...form,cheque_no:e.target.value})} placeholder="CHQ123456"/></div>
          <div className="form-group">
            <label>Bank</label>
            <select value={form.bank} onChange={e=>setForm({...form,bank:e.target.value})}>
              {['SBI','HDFC','ICICI','Axis','PNB','Kotak','BOB'].map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Amount (₹)</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
          <div className="form-group"><label>Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/></div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              <option value="payment">Payment</option><option value="receipt">Receipt</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
