import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function CreditManagement({ setPageTitle }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle({ title: 'Credit Management', sub: 'Accounts Module' });
    setLoading(true);
    api.get('/accounts/credit').then(d => { setVendors(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const overdue = vendors.filter(v => v.outstanding > v.credit_limit);
  const nearLimit = vendors.filter(v => v.outstanding > v.credit_limit*0.8 && v.outstanding <= v.credit_limit);
  const normal = vendors.filter(v => v.outstanding <= v.credit_limit*0.8);
  const totalExposure = vendors.reduce((s,v)=>s+(v.outstanding||0),0);

  const columns = [
    { key:'name', label:'Vendor', render:v=><strong>{v}</strong> },
    { key:'credit_limit', label:'Credit Limit', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'credit_days', label:'Days', render:v=><span className="badge badge-blue">{v}d</span> },
    { key:'outstanding', label:'Outstanding', render:v=><span className={`td-num ${v>0?'text-danger':''}`}>{fmtCur(v)}</span> },
    { key:'utilization_pct', label:'Utilization', render:(v,row)=>{
      const pct = Math.round((row.outstanding/row.credit_limit)*100)||0;
      const color = pct>100?'red':pct>80?'gold':'green';
      return (
        <div style={{minWidth:120}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:11}}>
            <span style={{color:`var(--${color==='red'?'danger':color==='gold'?'warning':'success'})`}}>{pct}%</span>
          </div>
          <div className="progress-bar"><div className={`progress-fill ${color==='gold'?'gold':color}`} style={{width:`${Math.min(pct,100)}%`}}/></div>
        </div>
      );
    }},
    { key:'id', label:'Status', sortable:false, render:(v,row)=>{
      const pct = (row.outstanding/row.credit_limit)*100;
      if (pct > 100) return <span className="badge badge-red">🔴 Overdue</span>;
      if (pct > 80) return <span className="badge badge-gold">🟡 Near Limit</span>;
      return <span className="badge badge-green">🟢 Normal</span>;
    }},
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Credit Management</h2>
          <p>Monitor credit periods, outstanding balances and overdue payments</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Exposure" value={totalExposure} icon={<AlertTriangle size={20}/>} color="gold" prefix="₹" />
        <StatCard label="Overdue Vendors" value={overdue.length} icon={<AlertTriangle size={20}/>} color="red" />
        <StatCard label="Near Credit Limit" value={nearLimit.length} icon={<AlertTriangle size={20}/>} color="gold" />
        <StatCard label="Within Limit" value={normal.length} icon={<AlertTriangle size={20}/>} color="green" />
      </div>

      {overdue.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="alert-card high" style={{ marginBottom: 10 }}>
            <div className="alert-icon"><AlertTriangle size={18}/></div>
            <div className="alert-content">
              <h4>{overdue.length} vendor(s) have exceeded their credit limit!</h4>
              <p>Immediate action required — {overdue.map(v=>v.name).join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Credit Status — All Vendors</div>
          <div style={{display:'flex',gap:8}}>
            <span className="badge badge-red">Overdue: {overdue.length}</span>
            <span className="badge badge-gold">Near Limit: {nearLimit.length}</span>
            <span className="badge badge-green">Normal: {normal.length}</span>
          </div>
        </div>
        <DataTable columns={columns} data={vendors} loading={loading} />
      </div>
    </div>
  );
}
