import React, { useState, useEffect } from 'react';
import { Plus, Building2 } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function BankManagement({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selBank, setSelBank] = useState('all');
  const [form, setForm] = useState({ bank_name:'SBI', type:'credit', amount:'', date:new Date().toISOString().split('T')[0], reference:'', description:'' });

  useEffect(() => {
    setPageTitle({ title: 'Bank Management', sub: 'Accounts Module' });
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [txns, sum] = await Promise.all([api.get('/accounts/bank'), api.get('/accounts/bank/summary')]);
    setData(txns); setSummary(sum); setLoading(false);
  };

  const save = async () => {
    await api.post('/accounts/bank', form);
    setModal(false);
    setForm({ bank_name:'SBI', type:'credit', amount:'', date:new Date().toISOString().split('T')[0], reference:'', description:'' });
    load();
  };

  const banks = [...new Set(data.map(d=>d.bank_name))];
  const filtered = selBank==='all'?data:data.filter(d=>d.bank_name===selBank);

  const columns = [
    { key:'date', label:'Date' },
    { key:'bank_name', label:'Bank', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'type', label:'Type', render:v=><span className={`badge ${v==='credit'?'badge-green':'badge-red'}`}>{v==='credit'?'↑ Credit':'↓ Debit'}</span> },
    { key:'amount', label:'Amount', render:(v,row)=><span className={`td-num ${row.type==='credit'?'text-success':'text-danger'}`}>{row.type==='credit'?'+':'-'}{fmtCur(v)}</span> },
    { key:'reference', label:'Reference', render:v=><span style={{fontFamily:'monospace',fontSize:11}}>{v}</span> },
    { key:'description', label:'Description' },
    { key:'status', label:'Status', render:v=><span className={`badge ${v==='cleared'?'badge-green':'badge-gold'}`}>{v}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Bank Management</h2>
          <p>Deposits, transfers, statement import and reconciliation</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> Add Transaction</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16, marginBottom:24 }}>
        {summary.map(s => (
          <div className="card" key={s.bank_name} style={{ borderTop:'2px solid var(--accent)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <strong style={{ fontSize:15 }}>{s.bank_name}</strong>
              <span className="badge badge-blue">Bank</span>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:8 }}>{fmtCur(s.balance)}</div>
            <div style={{ display:'flex', gap:16, fontSize:12 }}>
              <span style={{ color:'var(--success)' }}>↑ {fmtCur(s.total_credit)}</span>
              <span style={{ color:'var(--danger)' }}>↓ {fmtCur(s.total_debit)}</span>
            </div>
          </div>
        ))}
        <StatCard label="Total Balance" value={summary.reduce((s,b)=>s+(b.balance||0),0)} icon={<Building2 size={20}/>} color="blue" prefix="₹" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Transaction Register</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['all',...banks].map(b=>(
              <button key={b} className={`btn btn-sm ${selBank===b?'btn-primary':'btn-ghost'}`} onClick={()=>setSelBank(b)}>{b}</button>
            ))}
          </div>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Bank Transaction"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Save</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group">
            <label>Bank</label>
            <select value={form.bank_name} onChange={e=>setForm({...form,bank_name:e.target.value})}>
              {['SBI','HDFC','ICICI','Axis','PNB'].map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Transaction Type</label>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              <option value="credit">Credit (Deposit)</option><option value="debit">Debit (Withdrawal)</option>
            </select>
          </div>
          <div className="form-group"><label>Amount (₹)</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
          <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
          <div className="form-group"><label>Reference No</label><input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} placeholder="TXN-001"/></div>
          <div className="form-group"><label>Description</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description"/></div>
        </div>
      </Modal>
    </div>
  );
}
