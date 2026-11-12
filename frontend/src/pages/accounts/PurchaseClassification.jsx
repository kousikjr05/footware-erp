import React, { useState, useEffect } from 'react';
import { Tags } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

export default function PurchaseClassification({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle({ title: 'Purchase Classification', sub: 'Accounts Module' });
    api.get('/accounts/purchases').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const typeA = data.filter(d => d.type_ab === 'A');
  const typeB = data.filter(d => d.type_ab === 'B');
  const gst = data.filter(d => d.gst_type === 'GST');
  const nonGST = data.filter(d => d.gst_type === 'Non-GST');

  const sumAmt = arr => arr.reduce((s, d) => s + (d.total_amount || 0), 0);

  const columns = [
    { key: 'bill_no', label: 'Bill No', render: v => <strong>{v}</strong> },
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'bill_date', label: 'Date' },
    { key: 'type_ab', label: 'Type A/B', render: v => (
      <select defaultValue={v} style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px', fontSize:12, color:'var(--text)' }}>
        <option value="A">Type A</option><option value="B">Type B</option>
      </select>
    )},
    { key: 'gst_type', label: 'GST Classification', render: v => (
      <select defaultValue={v} style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px', fontSize:12, color:'var(--text)' }}>
        <option value="GST">GST</option><option value="Non-GST">Non-GST</option>
      </select>
    )},
    { key: 'total_amount', label: 'Amount', render: v => <span className="td-num">{fmtCur(v)}</span> },
    { key: 'cgst', label: 'CGST', render: v => <span className="td-num">{fmtCur(v)}</span> },
    { key: 'sgst', label: 'SGST', render: v => <span className="td-num">{fmtCur(v)}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Purchase Classification</h2>
          <p>Classify purchases by Type A/B and GST/Non-GST categories</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Type A Bills" value={typeA.length} icon={<Tags size={20}/>} color="blue" badge={fmtCur(sumAmt(typeA))} badgeType="up" />
        <StatCard label="Type B Bills" value={typeB.length} icon={<Tags size={20}/>} color="purple" badge={fmtCur(sumAmt(typeB))} badgeType="up" />
        <StatCard label="GST Purchases" value={gst.length} icon={<Tags size={20}/>} color="green" badge={fmtCur(sumAmt(gst))} badgeType="up" />
        <StatCard label="Non-GST Purchases" value={nonGST.length} icon={<Tags size={20}/>} color="gold" badge={fmtCur(sumAmt(nonGST))} badgeType="up" />
      </div>

      <div className="two-col" style={{ marginBottom: 20 }}>
        {[
          { label:'Type A — Local Purchases', items: typeA, color:'var(--accent)' },
          { label:'Type B — Interstate Purchases', items: typeB, color:'var(--purple)' },
        ].map(({ label, items, color }) => (
          <div className="card" key={label}>
            <div className="card-header"><div className="card-title" style={{ color }}>{label}</div><span className="badge badge-blue">{items.length} bills</span></div>
            <div style={{ fontSize:13 }}>
              {items.slice(0,5).map(it => (
                <div key={it.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span>{it.vendor_name}</span>
                  <span style={{ fontWeight:600 }}>{fmtCur(it.total_amount)}</span>
                </div>
              ))}
              {items.length > 5 && <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:8 }}>+{items.length-5} more bills</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">All Purchases — Classification View</div></div>
        <DataTable columns={columns} data={data} loading={loading} />
      </div>
    </div>
  );
}
