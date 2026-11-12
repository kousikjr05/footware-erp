import React, { useState, useEffect } from 'react';
import { Plus, Package } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function PurchaseExpenses({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ purchase_id:'', expense_type:'Freight', amount:'', allocated_to:'all' });

  useEffect(() => {
    setPageTitle({ title: 'Purchase Expenses', sub: 'Accounts Module' });
    load();
    api.get('/accounts/purchases').then(setPurchases);
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/accounts/purchase-expenses').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const save = async () => {
    await api.post('/accounts/purchase-expenses', form);
    setModal(false);
    setForm({ purchase_id:'', expense_type:'Freight', amount:'', allocated_to:'all' });
    load();
  };

  const freight = data.filter(d => d.expense_type === 'Freight');
  const packaging = data.filter(d => d.expense_type === 'Packaging');
  const transport = data.filter(d => d.expense_type === 'Transport');

  const columns = [
    { key:'bill_no', label:'Bill No', render:v=><strong>{v}</strong> },
    { key:'vendor_name', label:'Vendor' },
    { key:'expense_type', label:'Expense Type', render:v=>{
      const map = {Freight:'badge-blue', Packaging:'badge-green', Transport:'badge-purple'};
      return <span className={`badge ${map[v]||'badge-gray'}`}>{v}</span>;
    }},
    { key:'amount', label:'Amount', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'allocated_to', label:'Allocated To', render:v=><span className="text-muted">{v}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Purchase Expenses</h2>
          <p>Freight, packaging and transport charge allocation</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> Add Expense</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Expenses" value={data.reduce((s,d)=>s+(d.amount||0),0)} icon={<Package size={20}/>} color="gold" prefix="₹" />
        <StatCard label="Freight" value={freight.reduce((s,d)=>s+(d.amount||0),0)} icon={<Package size={20}/>} color="blue" prefix="₹" />
        <StatCard label="Packaging" value={packaging.reduce((s,d)=>s+(d.amount||0),0)} icon={<Package size={20}/>} color="green" prefix="₹" />
        <StatCard label="Transport" value={transport.reduce((s,d)=>s+(d.amount||0),0)} icon={<Package size={20}/>} color="purple" prefix="₹" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:16, marginBottom:20 }}>
        <div className="card">
          <div className="card-title" style={{marginBottom:16}}>Expense Breakdown</div>
          {[
            {label:'Freight', val:freight.reduce((s,d)=>s+(d.amount||0),0), pct:60, color:'blue'},
            {label:'Packaging', val:packaging.reduce((s,d)=>s+(d.amount||0),0), pct:25, color:'green'},
            {label:'Transport', val:transport.reduce((s,d)=>s+(d.amount||0),0), pct:15, color:'purple'},
          ].map(item => (
            <div key={item.label} style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}}>
                <span>{item.label}</span><strong>{fmtCur(item.val)}</strong>
              </div>
              <div className="progress-bar"><div className={`progress-fill ${item.color}`} style={{width:`${item.pct}%`}}/></div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Expense Register</div></div>
          <DataTable columns={columns} data={data} loading={loading} />
        </div>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Purchase Expense"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Save</button></>}>
        <div className="form-grid" style={{gap:14}}>
          <div className="form-group">
            <label>Purchase Bill</label>
            <select value={form.purchase_id} onChange={e=>setForm({...form,purchase_id:e.target.value})}>
              <option value="">Select bill</option>
              {purchases.map(p=><option key={p.id} value={p.id}>{p.bill_no} — {p.vendor_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Expense Type</label>
            <select value={form.expense_type} onChange={e=>setForm({...form,expense_type:e.target.value})}>
              <option>Freight</option><option>Packaging</option><option>Transport</option><option>Other</option>
            </select>
          </div>
          <div className="form-group"><label>Amount (₹)</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0"/></div>
          <div className="form-group">
            <label>Allocate To</label>
            <select value={form.allocated_to} onChange={e=>setForm({...form,allocated_to:e.target.value})}>
              <option value="all">All Items</option><option value="weight">By Weight</option><option value="value">By Value</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
