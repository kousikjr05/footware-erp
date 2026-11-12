import React, { useState, useEffect } from 'react';
import { Plus, Upload, FileText, RotateCcw } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

const statusBadge = s => {
  const map = { posted: 'badge-green', draft: 'badge-gold', return: 'badge-red' };
  return <span className={`badge ${map[s]||'badge-gray'}`}>{s}</span>;
};

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function PurchaseEntry({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState({
    vendor_id:'', bill_no:'', bill_date: new Date().toISOString().split('T')[0],
    type_ab:'A', gst_type:'GST', total_amount:'', cgst:'', sgst:'', igst:'', notes:'', status:'posted'
  });

  useEffect(() => {
    setPageTitle({ title: 'Purchase Entry', sub: 'Accounts Module' });
    load();
    api.get('/accounts/vendors').then(setVendors);
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/accounts/purchases').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const save = async () => {
    await api.post('/accounts/purchases', form);
    setModal(false);
    setForm({ vendor_id:'', bill_no:'', bill_date:new Date().toISOString().split('T')[0], type_ab:'A', gst_type:'GST', total_amount:'', cgst:'', sgst:'', igst:'', notes:'', status:'posted' });
    load();
  };

  const filtered = tab === 'all' ? data : data.filter(d => d.status === tab);
  const totalAmt = filtered.reduce((s, d) => s + (d.total_amount||0), 0);

  const columns = [
    { key:'bill_no', label:'Bill No', render: v => <strong>{v}</strong> },
    { key:'vendor_name', label:'Vendor' },
    { key:'bill_date', label:'Date' },
    { key:'type_ab', label:'Type', render: v => <span className={`badge ${v==='A'?'badge-blue':'badge-purple'}`}>Type {v}</span> },
    { key:'gst_type', label:'GST', render: v => <span className={`badge ${v==='GST'?'badge-green':'badge-gray'}`}>{v}</span> },
    { key:'total_amount', label:'Amount', render: v => <span className="td-num">{fmtCur(v)}</span> },
    { key:'cgst', label:'CGST', render: v => <span className="td-num">{fmtCur(v)}</span> },
    { key:'sgst', label:'SGST', render: v => <span className="td-num">{fmtCur(v)}</span> },
    { key:'status', label:'Status', render: v => statusBadge(v) },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Purchase Entry</h2>
          <p>Manage purchase bills, drafts and returns</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm"><Upload size={14}/> Import Bill</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={14}/> New Purchase</button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Bills" value={data.length} icon={<FileText size={20}/>} color="blue" />
        <StatCard label="Total Amount" value={totalAmt} icon={<FileText size={20}/>} color="gold" prefix="₹" />
        <StatCard label="Posted" value={data.filter(d=>d.status==='posted').length} icon={<FileText size={20}/>} color="green" />
        <StatCard label="Drafts" value={data.filter(d=>d.status==='draft').length} icon={<FileText size={20}/>} color="purple" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs" style={{ flex:1, maxWidth:400 }}>
            {['all','posted','draft','return'].map(t => (
              <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={()=>setTab(t)} style={{textTransform:'capitalize'}}>{t}</button>
            ))}
          </div>
          <div style={{ color:'var(--text-muted)', fontSize:13 }}>{filtered.length} bills · {fmtCur(totalAmt)}</div>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="New Purchase Entry"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Save Bill</button></>}>
        <div className="form-grid form-grid-2" style={{ gap:14 }}>
          <div className="form-group">
            <label>Vendor</label>
            <select value={form.vendor_id} onChange={e=>setForm({...form,vendor_id:e.target.value})}>
              <option value="">Select vendor</option>
              {vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Bill No</label><input value={form.bill_no} onChange={e=>setForm({...form,bill_no:e.target.value})} placeholder="BILL-2024-001"/></div>
          <div className="form-group"><label>Bill Date</label><input type="date" value={form.bill_date} onChange={e=>setForm({...form,bill_date:e.target.value})}/></div>
          <div className="form-group">
            <label>Type A/B</label>
            <select value={form.type_ab} onChange={e=>setForm({...form,type_ab:e.target.value})}>
              <option value="A">Type A</option><option value="B">Type B</option>
            </select>
          </div>
          <div className="form-group">
            <label>GST Type</label>
            <select value={form.gst_type} onChange={e=>setForm({...form,gst_type:e.target.value})}>
              <option>GST</option><option>Non-GST</option>
            </select>
          </div>
          <div className="form-group"><label>Total Amount (₹)</label><input type="number" value={form.total_amount} onChange={e=>setForm({...form,total_amount:e.target.value})} placeholder="0"/></div>
          <div className="form-group"><label>CGST (₹)</label><input type="number" value={form.cgst} onChange={e=>setForm({...form,cgst:e.target.value})} placeholder="0"/></div>
          <div className="form-group"><label>SGST (₹)</label><input type="number" value={form.sgst} onChange={e=>setForm({...form,sgst:e.target.value})} placeholder="0"/></div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              <option value="posted">Posted</option><option value="draft">Draft</option><option value="return">Return</option>
            </select>
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></div>
        </div>
      </Modal>
    </div>
  );
}
