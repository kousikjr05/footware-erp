import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { api } from '../../api';

export default function LowStockAlerts({ setPageTitle }) {
  const [alerts, setAlerts] = useState({ lowStock:[], outOfStock:[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle({ title: 'Low Stock Alerts', sub: 'Inventory Module' });
    api.get('/inventory/low-stock').then(d => { setAlerts(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Low Stock Alerts</h2>
          <p>Reorder alerts, out-of-stock warnings and minimum stock levels</p>
        </div>
        <span className="badge badge-red" style={{fontSize:12}}>
          {(alerts.lowStock?.length||0) + (alerts.outOfStock?.length||0)} Active Alerts
        </span>
      </div>

      <div className="stat-grid">
        <StatCard label="Out of Stock" value={alerts.outOfStock?.length||0} icon={<AlertTriangle size={20}/>} color="red" />
        <StatCard label="Low Stock" value={alerts.lowStock?.length||0} icon={<AlertTriangle size={20}/>} color="gold" />
        <StatCard label="Critical SKUs" value={(alerts.lowStock?.filter(a=>(a.qty||0)<=2)?.length)||0} icon={<Bell size={20}/>} color="red" />
        <StatCard label="Need Reorder" value={(alerts.lowStock?.length||0) + (alerts.outOfStock?.length||0)} icon={<Bell size={20}/>} color="purple" />
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div>
          {alerts.outOfStock?.length > 0 && (
            <div style={{marginBottom:24}}>
              <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,color:'var(--danger)'}}>🔴 Out of Stock — Requires Immediate Reorder</h3>
              <div className="alerts-grid">
                {alerts.outOfStock.map((item, i) => (
                  <div key={i} className="alert-card high">
                    <div className="alert-icon"><AlertTriangle size={18}/></div>
                    <div className="alert-content">
                      <h4>{item.name}</h4>
                      <p>Article: <strong>{item.article_no}</strong> · Brand: {item.brand} · Category: {item.category}</p>
                    </div>
                    <span className="badge badge-red">OUT OF STOCK</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alerts.lowStock?.length > 0 && (
            <div style={{marginBottom:24}}>
              <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,color:'var(--warning)'}}>🟡 Low Stock — Below Minimum Level</h3>
              <div className="alerts-grid">
                {alerts.lowStock.map((item, i) => (
                  <div key={i} className="alert-card medium">
                    <div className="alert-icon"><Bell size={18}/></div>
                    <div className="alert-content">
                      <h4>{item.name}</h4>
                      <p>
                        Article: <strong>{item.article_no}</strong> · Remaining: <strong style={{color:'var(--warning)'}}>{item.qty} pairs</strong> · Brand: {item.brand}
                      </p>
                    </div>
                    <span className="badge badge-gold">LOW STOCK</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(alerts.outOfStock?.length||0)===0 && (alerts.lowStock?.length||0)===0 && (
            <div className="card">
              <div className="empty-state">
                <Bell size={48}/>
                <h4>All Good!</h4>
                <p>No stock alerts at this time. All products are above minimum levels.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
