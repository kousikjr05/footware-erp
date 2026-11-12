import React, { useState, useCallback } from 'react';
import { Search, Barcode } from 'lucide-react';
import { api } from '../../api';

export default function StockSearch({ setPageTitle }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  React.useEffect(() => {
    setPageTitle({ title: 'Stock Search', sub: 'Inventory Module' });
  }, []);

  const search = async (val) => {
    setQ(val);
    if (val.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    const data = await api.get(`/inventory/search?q=${encodeURIComponent(val)}`);
    setResults(data); setLoading(false); setSearched(true);
  };

  const stockBadge = qty => {
    if (qty === 0) return <span className="badge badge-red">Out of Stock</span>;
    if (qty < 5) return <span className="badge badge-gold">Low Stock ({qty})</span>;
    return <span className="badge badge-green">{qty} in stock</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Stock Search</h2>
          <p>Search by article, barcode, size, colour, brand or rack</p>
        </div>
      </div>

      <div style={{ marginBottom:24, maxWidth:600 }}>
        <div className="search-bar" style={{ padding:'14px 18px', fontSize:15 }}>
          <Search size={18} />
          <input
            type="text"
            value={q}
            onChange={e=>search(e.target.value)}
            placeholder="Search article no, barcode, product name, brand, rack..."
            style={{ fontSize:15 }}
            autoFocus
          />
          {loading && <div className="spinner" style={{width:16,height:16}}/>}
        </div>
        {!q && (
          <div style={{ marginTop:12, fontSize:12, color:'var(--text-muted)', display:'flex', gap:16, flexWrap:'wrap' }}>
            <span>💡 Try: <strong style={{color:'var(--accent)'}}>ART001</strong></span>
            <span>or: <strong style={{color:'var(--accent)'}}>Relaxo</strong></span>
            <span>or: <strong style={{color:'var(--accent)'}}>UK8</strong></span>
            <span>or: <strong style={{color:'var(--accent)'}}>Black</strong></span>
          </div>
        )}
      </div>

      {searched && (
        <div style={{ marginBottom:12, fontSize:13, color:'var(--text-muted)' }}>
          Found <strong style={{color:'var(--text)'}}>{results.length}</strong> results for "<strong style={{color:'var(--accent)'}}>{q}</strong>"
        </div>
      )}

      <div style={{ display:'grid', gap:12 }}>
        {results.map((r, i) => (
          <div key={i} className="card" style={{ padding:16 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                  <strong style={{ fontSize:14 }}>{r.name}</strong>
                  <span className="badge badge-blue">{r.article_no}</span>
                  <span className="badge badge-purple">{r.brand}</span>
                </div>
                <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text-muted)', flexWrap:'wrap' }}>
                  <span>Size: <strong style={{color:'var(--text)'}}>{r.size}</strong></span>
                  <span>Colour: <strong style={{color:'var(--text)'}}>{r.colour}</strong></span>
                  <span>Barcode: <strong style={{color:'var(--text)', fontFamily:'monospace'}}>{r.barcode}</strong></span>
                  <span>MRP: <strong style={{color:'var(--gold)'}}>₹{r.mrp}</strong></span>
                </div>
                <div style={{ marginTop:6, fontSize:12, color:'var(--text-muted)' }}>
                  📍 {r.department||'—'} · Rack: <strong style={{color:'var(--text)'}}>{r.rack_no||'—'}</strong> · Shelf: {r.shelf||'—'}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                {stockBadge(r.qty)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {searched && results.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Search size={48}/>
            <h4>No results found</h4>
            <p>Try a different search term — article number, barcode, brand or colour</p>
          </div>
        </div>
      )}

      {!searched && (
        <div className="card" style={{ marginTop:8 }}>
          <div className="empty-state">
            <Search size={48}/>
            <h4>Start typing to search</h4>
            <p>Search across all products, variants, barcodes and rack locations</p>
          </div>
        </div>
      )}
    </div>
  );
}
