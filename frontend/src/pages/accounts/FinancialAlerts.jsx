import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, FileCheck, CreditCard } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { api } from '../../api';

const fmtCur = n => '₹' + (n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function FinancialAlerts({ setPageTitle }) {
  const [alerts, setAlerts] = useState({ overdueVendors:[], pendingCheques:[], pendingPayments:[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle({ title: 'Financial Alerts', sub: 'Accounts Module' });
    setLoading(true);
    api.get('/accounts/alerts').then(d => { setAlerts(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalOverdue = alerts.overdueVendors.reduce((s,v)=>s+(v.outstanding-v.credit_limit),0);
  const totalPendingCheques = alerts.pendingCheques.reduce((s,c)=>s+(c.amount||0),0);
  const totalPendingPay = alerts.pendingPayments.reduce((s,p)=>s+(p.amount||0),0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Financial Alerts</h2>
          <p>Vendor dues, overdue payments and cheque alerts</p>
        </div>
        <span className="badge badge-red" style={{fontSize:12}}>
          {alerts.overdueVendors.length + alerts.pendingCheques.length + alerts.pendingPayments.length} Active Alerts
        </span>
      </div>

      <div className="stat-grid">
        <StatCard label="Overdue Vendors" value={alerts.overdueVendors.length} icon={<AlertTriangle size={20}/>} color="red" />
        <StatCard label="Overdue Amount" value={totalOverdue} icon={<CreditCard size={20}/>} color="red" prefix="₹" />
        <StatCard label="Cheques Due Soon" value={alerts.pendingCheques.length} icon={<FileCheck size={20}/>} color="gold" />
        <StatCard label="Pending Payments" value={alerts.pendingPayments.length} icon={<Bell size={20}/>} color="purple" />
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> : (
        <div>
          {alerts.overdueVendors.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12, color:'var(--danger)' }}>🔴 Credit Limit Exceeded</h3>
              <div className="alerts-grid">
                {alerts.overdueVendors.map((v, i) => (
                  <div key={i} className="alert-card high">
                    <div className="alert-icon"><AlertTriangle size={18}/></div>
                    <div className="alert-content">
                      <h4>{v.name}</h4>
                      <p>Outstanding <strong style={{color:'var(--danger)'}}>{fmtCur(v.outstanding)}</strong> exceeds limit of {fmtCur(v.credit_limit)} by {fmtCur(v.outstanding-v.credit_limit)}</p>
                    </div>
                    <span className="badge badge-red">OVERDUE</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alerts.pendingCheques.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12, color:'var(--warning)' }}>🟡 Cheques Due Within 7 Days</h3>
              <div className="alerts-grid">
                {alerts.pendingCheques.map((c, i) => (
                  <div key={i} className="alert-card medium">
                    <div className="alert-icon"><FileCheck size={18}/></div>
                    <div className="alert-content">
                      <h4>Cheque {c.cheque_no} — {c.vendor_name}</h4>
                      <p>Amount: <strong>{fmtCur(c.amount)}</strong> · Bank: {c.bank} · Due: <strong>{c.due_date}</strong></p>
                    </div>
                    <span className="badge badge-gold">DUE SOON</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alerts.pendingPayments.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12, color:'var(--purple)' }}>🔵 Pending Payments</h3>
              <div className="alerts-grid">
                {alerts.pendingPayments.map((p, i) => (
                  <div key={i} className="alert-card low">
                    <div className="alert-icon"><CreditCard size={18}/></div>
                    <div className="alert-content">
                      <h4>{p.vendor_name} — {p.mode}</h4>
                      <p>Amount: <strong>{fmtCur(p.amount)}</strong> · Reference: {p.reference} · Date: {p.date}</p>
                    </div>
                    <span className="badge badge-purple">PENDING</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alerts.overdueVendors.length === 0 && alerts.pendingCheques.length === 0 && alerts.pendingPayments.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <Bell size={48}/>
                <h4>All Clear!</h4>
                <p>No financial alerts at this time. All payments and credits are within limits.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
