import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, ChevronRight } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Accounting({ setPageTitle }) {
  const [accounts, setAccounts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('accounts');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ account_id:'', date:new Date().toISOString().split('T')[0], description:'', debit:'', credit:'', reference:'' });

  useEffect(() => {
    setPageTitle({ title: 'Accounting', sub: 'Accounts Module' });
    setLoading(true);
    Promise.all([api.get('/accounts/accounts'), api.get('/accounts/ledger')])
      .then(([a, l]) => { setAccounts(a); setLedger(l); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    await api.post('/accounts/ledger', form);
    setModal(false);
    const l = await api.get('/accounts/ledger');
    setLedger(l);
  };

  const typeColor = { asset:'blue', liability:'red', equity:'purple', revenue:'green', expense:'gold' };

  const topLevel = accounts.filter(a => !a.parent_id);
  const getChildren = (id) => accounts.filter(a => a.parent_id === id);

  const AccountNode = ({ acc, depth = 0 }) => {
    const [expanded, setExpanded] = useState(depth < 1);
    const children = getChildren(acc.id);
    return (
      <div className="tree-node">
        <div className="tree-node-row" onClick={() => setExpanded(!expanded)} style={{ paddingLeft: 12 + depth*16 }}>
          {children.length > 0 && <ChevronRight size={14} style={{ transform: expanded?'rotate(90deg)':'none', transition:'transform 0.2s', color:'var(--text-muted)' }}/>}
          {children.length === 0 && <div style={{width:14}}/>}
          <span className={`badge badge-${typeColor[acc.type]||'gray'}`} style={{fontSize:9}}>{acc.type}</span>
          <span style={{fontFamily:'monospace', fontSize:11, color:'var(--text-muted)'}}>{acc.code}</span>
          <span style={{flex:1, fontWeight: children.length?600:400}}>{acc.name}</span>
          <span style={{fontFamily:'monospace', fontSize:12, fontWeight:600}}>{fmtCur(acc.balance)}</span>
        </div>
        {expanded && children.length > 0 && (
          <div className="tree-children">
            {children.map(c => <AccountNode key={c.id} acc={c} depth={depth+1} />)}
          </div>
        )}
      </div>
    );
  };

  const ledgerCols = [
    { key:'date', label:'Date' },
    { key:'code', label:'Code', render:v=><span style={{fontFamily:'monospace',fontSize:11}}>{v}</span> },
    { key:'account_name', label:'Account', render:v=><strong>{v}</strong> },
    { key:'description', label:'Description' },
    { key:'debit', label:'Debit (₹)', render:v=><span className={`td-num ${v>0?'text-danger':''}`}>{v>0?fmtCur(v):'-'}</span> },
    { key:'credit', label:'Credit (₹)', render:v=><span className={`td-num ${v>0?'text-success':''}`}>{v>0?fmtCur(v):'-'}</span> },
    { key:'reference', label:'Reference', render:v=><span style={{fontFamily:'monospace',fontSize:11}}>{v}</span> },
  ];

  const assets = accounts.filter(a=>a.type==='asset'&&a.balance>0).reduce((s,a)=>s+a.balance,0);
  const liab = accounts.filter(a=>a.type==='liability'&&a.balance>0).reduce((s,a)=>s+a.balance,0);
  const eq = accounts.filter(a=>a.type==='equity'&&a.balance>0).reduce((s,a)=>s+a.balance,0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Accounting</h2>
          <p>Chart of accounts, ledgers, cash and bank books</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> Journal Entry</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Assets" value={assets} icon={<BookOpen size={20}/>} color="blue" prefix="₹" />
        <StatCard label="Total Liabilities" value={liab} icon={<BookOpen size={20}/>} color="red" prefix="₹" />
        <StatCard label="Net Equity" value={eq} icon={<BookOpen size={20}/>} color="green" prefix="₹" />
        <StatCard label="Total Accounts" value={accounts.length} icon={<BookOpen size={20}/>} color="purple" />
      </div>

      <div className="tabs" style={{maxWidth:300}}>
        <button className={`tab-btn ${tab==='accounts'?'active':''}`} onClick={()=>setTab('accounts')}>Chart of Accounts</button>
        <button className={`tab-btn ${tab==='ledger'?'active':''}`} onClick={()=>setTab('ledger')}>Ledger Entries</button>
      </div>

      {tab === 'accounts' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Chart of Accounts</div><span className="text-muted text-sm">{accounts.length} accounts</span></div>
          {loading ? <div className="loading"><div className="spinner"/></div> : (
            <div>
              {topLevel.map(acc => <AccountNode key={acc.id} acc={acc} />)}
            </div>
          )}
        </div>
      )}

      {tab === 'ledger' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Ledger Entries</div></div>
          <DataTable columns={ledgerCols} data={ledger} loading={loading} />
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="New Journal Entry"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Post Entry</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group">
            <label>Account</label>
            <select value={form.account_id} onChange={e=>setForm({...form,account_id:e.target.value})}>
              <option value="">Select account</option>
              {accounts.filter(a=>!getChildren(a.id).length).map(a=><option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Description</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Entry description"/></div>
          <div className="form-group"><label>Debit (₹)</label><input type="number" value={form.debit} onChange={e=>setForm({...form,debit:e.target.value})} placeholder="0"/></div>
          <div className="form-group"><label>Credit (₹)</label><input type="number" value={form.credit} onChange={e=>setForm({...form,credit:e.target.value})} placeholder="0"/></div>
          <div className="form-group"><label>Reference</label><input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} placeholder="REF-001"/></div>
        </div>
      </Modal>
    </div>
  );
}
