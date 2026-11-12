import React, { useState, useEffect } from 'react';
import { Plus, Users, Eye } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function VendorAccounts({ setPageTitle }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [ledgerModal, setLedgerModal] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [selVendor, setSelVendor] = useState(null);
  const [form, setForm] = useState({ name:'', contact:'', email:'', gst_no:'', credit_limit:100000, credit_days:30, address:'' });

  useEffect(() => {
    setPageTitle({ title: 'Vendor Accounts', sub: 'Accounts Module' });
    load();
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/accounts/vendors').then(d => { setVendors(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const viewLedger = async (vendor) => {
    setSelVendor(vendor);
    const data = await api.get(`/accounts/vendors/${vendor.id}/ledger`);
    setLedger(data);
    setLedgerModal(true);
  };

  const save = async () => {
    await api.post('/accounts/vendors', form);
    setModal(false);
    setForm({ name:'', contact:'', email:'', gst_no:'', credit_limit:100000, credit_days:30, address:'' });
    load();
  };

  const totalOutstanding = vendors.reduce((s, v) => s + (v.outstanding||0), 0);
  const overdueCount = vendors.filter(v => v.outstanding > v.credit_limit).length;

  const columns = [
    { key:'name', label:'Vendor Name', render:v=><strong>{v}</strong> },
    { key:'gst_no', label:'GST No', render:v=><span style={{fontFamily:'monospace',fontSize:11}}>{v}</span> },
    { key:'credit_limit', label:'Credit Limit', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'credit_days', label:'Credit Days', render:v=><span className="badge badge-blue">{v}d</span> },
    { key:'outstanding', label:'Outstanding', render:v=><span className={`td-num ${v>0?'text-danger':''}`}>{fmtCur(v)}</span> },
    { key:'id', label:'Action', sortable:false, render:(v,row)=><button className="btn btn-ghost btn-xs" onClick={()=>viewLedger(row)}><Eye size={12}/> Ledger</button> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Vendor Accounts</h2>
          <p>Manage vendor ledgers, credit and outstanding balances</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> Add Vendor</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Vendors" value={vendors.length} icon={<Users size={20}/>} color="blue" />
        <StatCard label="Total Outstanding" value={totalOutstanding} icon={<Users size={20}/>} color="gold" prefix="₹" />
        <StatCard label="Credit Limit Used" value={Math.round(totalOutstanding/vendors.reduce((s,v)=>s+(v.credit_limit||0),0)*100)||0} icon={<Users size={20}/>} color="purple" suffix="%" />
        <StatCard label="Overdue Vendors" value={overdueCount} icon={<Users size={20}/>} color="red" />
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Vendor Directory</div><span className="badge badge-blue">{vendors.length} vendors</span></div>
        <DataTable columns={columns} data={vendors} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Add New Vendor"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Save Vendor</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Vendor Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Company name"/></div>
          <div className="form-group"><label>Contact</label><input value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} placeholder="Phone"/></div>
          <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@company.com"/></div>
          <div className="form-group"><label>GST Number</label><input value={form.gst_no} onChange={e=>setForm({...form,gst_no:e.target.value})} placeholder="27AABCR1234A1Z5"/></div>
          <div className="form-group"><label>Credit Limit (₹)</label><input type="number" value={form.credit_limit} onChange={e=>setForm({...form,credit_limit:e.target.value})}/></div>
          <div className="form-group"><label>Credit Days</label><input type="number" value={form.credit_days} onChange={e=>setForm({...form,credit_days:e.target.value})}/></div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Address</label><textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} rows={2}/></div>
        </div>
      </Modal>

      <Modal open={ledgerModal} onClose={()=>setLedgerModal(false)} title={`Ledger — ${selVendor?.name}`} size="lg">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Debit (₹)</th><th>Credit (₹)</th></tr></thead>
            <tbody>
              {ledger.map((l,i)=>(
                <tr key={i}>
                  <td>{l.date}</td>
                  <td><span className={`badge ${l.type==='purchase'?'badge-red':'badge-green'}`}>{l.type}</span></td>
                  <td>{l.ref}</td>
                  <td className="td-num">{l.type==='purchase'?fmtCur(l.amount):'-'}</td>
                  <td className="td-num">{l.type==='payment'?fmtCur(l.amount):'-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
