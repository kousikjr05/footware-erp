import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { api } from '../../api';

export default function SizeColourInventory({ setPageTitle }) {
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [selProduct, setSelProduct] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle({ title: 'Size & Colour Inventory', sub: 'Inventory Module' });
    api.get('/inventory/products').then(p => { setProducts(p); setLoading(false); });
    api.get('/inventory/size-colour').then(setData);
  }, []);

  const filtered = selProduct ? data.filter(d => products.find(p=>p.id==selProduct)?.name === d.product) : data;

  // Build pivot: article → size → colour → qty
  const articles = [...new Set(filtered.map(d=>d.article_no))];
  const sizes = [...new Set(filtered.map(d=>d.size))].sort();
  const colours = [...new Set(filtered.map(d=>d.colour))];

  const getQty = (art, sz, cl) => {
    const row = filtered.find(d=>d.article_no===art && d.size===sz && d.colour===cl);
    return row?.qty || 0;
  };

  const cellClass = qty => qty > 10 ? 'high' : qty > 3 ? 'mid' : qty > 0 ? 'low' : 'zero';

  const totalQty = filtered.reduce((s,d)=>s+(d.qty||0),0);
  const skus = filtered.length;
  const zeroSkus = filtered.filter(d=>!d.qty).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Size & Colour Inventory</h2>
          <p>Track stock by product variant — size and colour matrix</p>
        </div>
        <select value={selProduct} onChange={e=>setSelProduct(e.target.value)} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px', color:'var(--text)', fontSize:13, minWidth:200 }}>
          <option value="">All Products</option>
          {products.map(p=><option key={p.id} value={p.id}>{p.article_no} — {p.name}</option>)}
        </select>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Units" value={totalQty} icon={<Palette size={20}/>} color="blue" />
        <StatCard label="Total SKUs" value={skus} icon={<Palette size={20}/>} color="green" />
        <StatCard label="Zero Stock SKUs" value={zeroSkus} icon={<Palette size={20}/>} color="red" />
        <StatCard label="Sizes Tracked" value={sizes.length} icon={<Palette size={20}/>} color="purple" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Pivot Grid — Stock by Size & Colour</div>
          <div style={{display:'flex',gap:12,fontSize:12}}>
            <span style={{color:'var(--success)'}}>■ &gt;10 units</span>
            <span style={{color:'var(--warning)'}}>■ 4-10 units</span>
            <span style={{color:'var(--danger)'}}>■ 1-3 units</span>
            <span style={{color:'var(--text-muted)'}}>■ 0 units</span>
          </div>
        </div>
        {loading ? <div className="loading"><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table className="pivot-table">
              <thead>
                <tr>
                  <th>Article / Size</th>
                  {sizes.map(sz=><th key={sz}>{sz}</th>)}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {articles.slice(0,20).map(art => {
                  const rows = colours.map(cl => ({
                    colour: cl,
                    sizes: sizes.map(sz => getQty(art, sz, cl))
                  }));
                  return rows.map((r, ri) => (
                    <tr key={`${art}-${r.colour}`}>
                      {ri===0 && <td rowSpan={rows.length} style={{textAlign:'left'}}><strong>{art}</strong></td>}
                      {r.sizes.map((qty, si) => (
                        <td key={si}>
                          <span className={`pivot-cell ${cellClass(qty)}`} style={{color: qty===0?'var(--text-muted)':''}}>{qty||'—'}</span>
                        </td>
                      ))}
                      <td><strong>{r.sizes.reduce((s,v)=>s+v,0)}</strong></td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
