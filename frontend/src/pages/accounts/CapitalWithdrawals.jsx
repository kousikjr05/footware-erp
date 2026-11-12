import React, { useState, useEffect } from 'react';
import { Plus, Wallet } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function CapitalWithdrawals({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ type:'capital', amount:'', date:new Date().toISOString().split('T')[0], description:'', reference:'' });

  useEffect(() => {
    setPageTitle({ title: 'Capital & Withdrawals', sub: 'Accounts Module' });
    load();
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/accounts/capital').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const save = async () => {
    await api.post('/accounts/capital', form);
    setModal(false);
    setForm({ type:'capital', amount:'', date:new Date().toISOString().split('T')[0], description:'', reference:'' });
    load();
  };

  const totalCapital = data.filter(d=>d.type==='capital').reduce((s,d)=>s+(d.amount||0),0);
  const totalWithdraw = data.filter(d=>d.type==='withdrawal').reduce((s,d)=>s+(d.amount||0),0);
  const netCapital = totalCapital - totalWithdraw;

  const columns = [
    { key:'date', label:'Date' },
    { key:'type', label:'Type', render:v=><span className={`badge ${v==='capital'?'badge-green':'badge-red'}`}>{v==='capital'?'+ Capital':'- Withdrawal'}</span> },
    { key:'amount', label:'Amount', render:(v,row)=><span className={`td-num ${row.type==='capital'?'text-success':'text-danger'}`}>{row.type==='capital'?'+':'-'}{fmtCur(v)}</span> },
    { key:'description', label:'Description' },
    { key:'reference', label:'Reference', render:v=><span style={{fontFamily:'monospace',fontSize:11}}>{v}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Capital & Withdrawals</h2>
          <p>Owner's capital contributions and withdrawal accounting records</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> Add Entry</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Capital Infused" value={totalCapital} icon={<Wallet size={20}/>} color="green" prefix="₹" />
        <StatCard label="Total Withdrawals" value={totalWithdraw} icon={<Wallet size={20}/>} color="red" prefix="₹" />
        <StatCard label="Net Capital" value={netCapital} icon={<Wallet size={20}/>} color="blue" prefix="₹" />
        <StatCard label="Total Transactions" value={data.length} icon={<Wallet size={20}/>} color="purple" />
      </div>

      <div style={{ marginBottom:20, padding:20, background:'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(59,130,246,0.05))', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Net Owner's Equity</div>
            <div style={{ fontSize:28, fontWeight:800, color:'var(--success)' }}>{fmtCur(netCapital)}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>Capital Added</div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--success)' }}>{fmtCur(totalCapital)}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>Withdrawn</div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--danger)' }}>-{fmtCur(totalWithdraw)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Capital & Withdrawal Register</div></div>
        <DataTable columns={columns} data={data} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="New Capital / Withdrawal Entry"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Save Entry</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group">
            <label>Entry Type</label>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              <option value="capital">Capital Addition</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>
          <div className="form-group"><label>Amount (₹)</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0"/></div>
          <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
          <div className="form-group"><label>Reference</label><input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} placeholder="CAP-001"/></div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Description</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description"/></div>
        </div>
      </Modal>
    </div>
  );
}
