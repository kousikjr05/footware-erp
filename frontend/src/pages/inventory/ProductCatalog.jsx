import React, { useState, useEffect } from 'react';
import { Plus, Package, Eye } from 'lucide-react';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function ProductCatalog({ setPageTitle }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selProduct, setSelProduct] = useState(null);
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState({ article_no:'', name:'', brand:'', category:'Mens Casual', cost_price:'', mrp:'', hsn_code:'' });

  useEffect(() => {
    setPageTitle({ title: 'Product Catalog', sub: 'Inventory Module' });
    load();
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/inventory/products').then(d => { setProducts(d); setLoading(false); }).catch(() => setLoading(false));
  };

  const save = async () => {
    await api.post('/inventory/products', form);
    setModal(false);
    setForm({ article_no:'', name:'', brand:'', category:'Mens Casual', cost_price:'', mrp:'', hsn_code:'' });
    load();
  };

  const cats = [...new Set(products.map(p=>p.category))];
  const filtered = tab==='all'?products:products.filter(p=>p.category===tab);

  const columns = [
    { key:'article_no', label:'Article No', render:v=><strong style={{fontFamily:'monospace'}}>{v}</strong> },
    { key:'name', label:'Product Name', render:v=><strong>{v}</strong> },
    { key:'brand', label:'Brand', render:v=><span className="badge badge-blue">{v}</span> },
    { key:'category', label:'Category', render:v=><span className="badge badge-purple">{v}</span> },
    { key:'cost_price', label:'Cost', render:v=><span className="td-num">{fmtCur(v)}</span> },
    { key:'mrp', label:'MRP', render:v=><span className="td-num font-bold">{fmtCur(v)}</span> },
    { key:'total_stock', label:'Stock', render:v=>{
      if (!v || v===0) return <span className="badge badge-red">Out</span>;
      if (v<5) return <span className="badge badge-gold">{v}</span>;
      return <span className="badge badge-green">{v}</span>;
    }},
    { key:'id', label:'', sortable:false, render:(v,row)=><button className="btn btn-ghost btn-xs" onClick={()=>{setSelProduct(row);setDetailModal(true);}}><Eye size={12}/> View</button> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Product Catalog</h2>
          <p>Master product list with article, brand, pricing and stock</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Plus size={14}/> Add Product</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Products" value={products.length} icon={<Package size={20}/>} color="blue" />
        <StatCard label="Brands" value={new Set(products.map(p=>p.brand)).size} icon={<Package size={20}/>} color="purple" />
        <StatCard label="Categories" value={cats.length} icon={<Package size={20}/>} color="green" />
        <StatCard label="Total Stock" value={products.reduce((s,p)=>s+(p.total_stock||0),0)} icon={<Package size={20}/>} color="gold" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Product Catalog</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <button className={`btn btn-xs ${tab==='all'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('all')}>All</button>
            {cats.map(c=><button key={c} className={`btn btn-xs ${tab===c?'btn-primary':'btn-ghost'}`} onClick={()=>setTab(c)}>{c}</button>)}
          </div>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Add New Product"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={save}>Save Product</button></>}>
        <div className="form-grid form-grid-2" style={{gap:14}}>
          <div className="form-group"><label>Article No</label><input value={form.article_no} onChange={e=>setForm({...form,article_no:e.target.value})} placeholder="ART-021"/></div>
          <div className="form-group"><label>Product Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Product name"/></div>
          <div className="form-group"><label>Brand</label><input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} placeholder="Brand name"/></div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              {['Mens Casual','Mens Formal','Ladies Casual','Ladies Formal','Kids','Sports','Sandals'].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Cost Price (₹)</label><input type="number" value={form.cost_price} onChange={e=>setForm({...form,cost_price:e.target.value})}/></div>
          <div className="form-group"><label>MRP (₹)</label><input type="number" value={form.mrp} onChange={e=>setForm({...form,mrp:e.target.value})}/></div>
          <div className="form-group"><label>HSN Code</label><input value={form.hsn_code} onChange={e=>setForm({...form,hsn_code:e.target.value})} placeholder="6404"/></div>
        </div>
      </Modal>

      <Modal open={detailModal} onClose={()=>setDetailModal(false)} title={selProduct?.name||'Product Detail'}>
        {selProduct && (
          <div style={{display:'grid',gap:12}}>
            {[['Article No',selProduct.article_no],['Brand',selProduct.brand],['Category',selProduct.category],['Cost Price',fmtCur(selProduct.cost_price)],['MRP',fmtCur(selProduct.mrp)],['HSN Code',selProduct.hsn_code],['Total Stock',selProduct.total_stock+' units']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                <span style={{color:'var(--text-muted)'}}>{k}</span><strong>{v}</strong>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
