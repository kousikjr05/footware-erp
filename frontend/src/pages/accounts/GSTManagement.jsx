import React, { useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function GSTManagement({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    setPageTitle({ title: 'GST Management', sub: 'Accounts Module' });
    setLoading(true);
    Promise.all([api.get('/accounts/gst'), api.get('/accounts/gst/summary')])
      .then(([d, s]) => { setData(d); setSummary(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = tab==='all'?data:data.filter(d=>d.type===tab);

  const columns = [
    { key:'date', label:'Date' },
    { key:'type', label:'Type', render:v=><span className={`badge ${v==='input'?'badge-green':'badge-blue'}`}>{v==='input'?'Input':'Output'}</span> },
    { key:'party', label:'Party', render:v=><strong>{v}</strong> },
    { key:'invoice_no', label:'Invoice No', render:v=><span style={{fontFamily:'monospace',fontSize:11}}>{v}</span> },
    { key:'taxable_amount', label:'Taxable', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'cgst', label:'CGST', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'sgst', label:'SGST', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'igst', label:'IGST', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'total', label:'Total', render:v=><span className="td-num font-bold">{fmtCur(v)}</span> },
    { key:'gst_category', label:'Category', render:v=><span className="badge badge-purple">{v}</span> },
  ];

  const inp = summary?.input || {};
  const out = summary?.output || {};

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>GST Management</h2>
          <p>Input/output GST, tax summaries and GSTR reports</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Input Tax Credit" value={(inp.cgst||0)+(inp.sgst||0)+(inp.igst||0)} icon={<Receipt size={20}/>} color="green" prefix="₹" />
        <StatCard label="Output Tax" value={(out.cgst||0)+(out.sgst||0)+(out.igst||0)} icon={<Receipt size={20}/>} color="blue" prefix="₹" />
        <StatCard label="Net GST Payable" value={summary?.liability||0} icon={<Receipt size={20}/>} color={summary?.liability>0?'red':'green'} prefix="₹" />
        <StatCard label="Total Transactions" value={data.length} icon={<Receipt size={20}/>} color="purple" />
      </div>

      <div className="two-col" style={{ marginBottom: 20 }}>
        {[
          { label:'Input GST (ITC)', data:inp, color:'var(--success)' },
          { label:'Output GST (Payable)', data:out, color:'var(--accent)' },
        ].map(({ label, data, color }) => (
          <div className="card" key={label}>
            <div className="card-title" style={{ marginBottom:16, color }}>{label}</div>
            {[['Taxable Amount','taxable'],['CGST (9%)','cgst'],['SGST (9%)','sgst'],['IGST (18%)','igst']].map(([lbl,key])=>(
              <div key={key} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13 }}>
                <span style={{ color:'var(--text-muted)' }}>{lbl}</span>
                <strong>{fmtCur(data[key]||0)}</strong>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">GST Transactions</div>
          <div className="tabs" style={{maxWidth:260}}>
            <button className={`tab-btn ${tab==='all'?'active':''}`} onClick={()=>setTab('all')}>All</button>
            <button className={`tab-btn ${tab==='input'?'active':''}`} onClick={()=>setTab('input')}>Input</button>
            <button className={`tab-btn ${tab==='output'?'active':''}`} onClick={()=>setTab('output')}>Output</button>
          </div>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>
    </div>
  );
}
