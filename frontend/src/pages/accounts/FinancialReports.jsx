import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function FinancialReports({ setPageTitle }) {
  const [balSheet, setBalSheet] = useState({ assets:[], liabilities:[], equity:[] });
  const [trial, setTrial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('balance');

  useEffect(() => {
    setPageTitle({ title: 'Financial Reports', sub: 'Accounts Module' });
    setLoading(true);
    Promise.all([api.get('/accounts/balance-sheet'), api.get('/accounts/trial-balance')])
      .then(([b, t]) => { setBalSheet(b); setTrial(t); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sumBal = arr => arr.filter(a=>!a.parent_id||true).reduce((s,a)=>s+(a.balance||0),0);

  const Section = ({ title, accounts, color }) => (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, color, marginBottom:8, textTransform:'uppercase' }}>{title}</div>
      {accounts.map(a => (
        <div key={a.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:13, paddingLeft: a.parent_id?16:0 }}>
          <span style={{ color: a.parent_id?'var(--text-sec)':'var(--text)', fontWeight: a.parent_id?400:600 }}>
            <span style={{ fontFamily:'monospace', fontSize:10, color:'var(--text-muted)', marginRight:8 }}>{a.code}</span>{a.name}
          </span>
          <span style={{ fontFamily:'monospace', fontWeight:600 }}>{fmtCur(a.balance)}</span>
        </div>
      ))}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderTop:'2px solid var(--border)', fontWeight:700, fontSize:13 }}>
        <span style={{ color }}>Total {title}</span>
        <span style={{ color }}>{fmtCur(sumBal(accounts))}</span>
      </div>
    </div>
  );

  const trialCols = [
    { key:'code', label:'Code', render:v=><span style={{fontFamily:'monospace',fontSize:11}}>{v}</span> },
    { key:'name', label:'Account', render:v=><strong>{v}</strong> },
    { key:'type', label:'Type', render:v=><span className={`badge badge-blue`} style={{textTransform:'capitalize'}}>{v}</span> },
    { key:'total_debit', label:'Total Debit', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'total_credit', label:'Total Credit', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'id', label:'Net', sortable:false, render:(v,row)=>{
      const net = row.total_debit - row.total_credit;
      return <span className={`td-num ${net>0?'text-danger':net<0?'text-success':''}`}>{net!==0?fmtCur(Math.abs(net)):'-'}</span>;
    }},
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Financial Reports</h2>
          <p>Balance sheet, trial balance, ledgers and payables</p>
        </div>
        <button className="btn btn-ghost btn-sm"><BarChart3 size={14}/> Export PDF</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Assets" value={sumBal(balSheet.assets)} icon={<BarChart3 size={20}/>} color="blue" prefix="₹" />
        <StatCard label="Total Liabilities" value={sumBal(balSheet.liabilities)} icon={<BarChart3 size={20}/>} color="red" prefix="₹" />
        <StatCard label="Net Equity" value={sumBal(balSheet.equity)} icon={<BarChart3 size={20}/>} color="green" prefix="₹" />
        <StatCard label="Total Accounts" value={trial.length} icon={<BarChart3 size={20}/>} color="purple" />
      </div>

      <div className="tabs" style={{maxWidth:380}}>
        <button className={`tab-btn ${tab==='balance'?'active':''}`} onClick={()=>setTab('balance')}>Balance Sheet</button>
        <button className={`tab-btn ${tab==='trial'?'active':''}`} onClick={()=>setTab('trial')}>Trial Balance</button>
      </div>

      {tab === 'balance' && !loading && (
        <div className="two-col">
          <div className="card">
            <div className="card-header"><div className="card-title">Assets</div></div>
            <Section title="Assets" accounts={balSheet.assets} color="var(--accent)" />
          </div>
          <div>
            <div className="card" style={{ marginBottom:16 }}>
              <div className="card-header"><div className="card-title">Liabilities</div></div>
              <Section title="Liabilities" accounts={balSheet.liabilities} color="var(--danger)" />
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title">Equity</div></div>
              <Section title="Equity" accounts={balSheet.equity} color="var(--success)" />
            </div>
          </div>
        </div>
      )}

      {tab === 'trial' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Trial Balance</div>
            <div style={{display:'flex',gap:12,fontSize:13}}>
              <span>Total Debit: <strong>{fmtCur(trial.reduce((s,r)=>s+r.total_debit,0))}</strong></span>
              <span>Total Credit: <strong>{fmtCur(trial.reduce((s,r)=>s+r.total_credit,0))}</strong></span>
            </div>
          </div>
          <DataTable columns={trialCols} data={trial} loading={loading} />
        </div>
      )}
    </div>
  );
}
