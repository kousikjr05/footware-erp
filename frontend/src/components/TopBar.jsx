import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw } from 'lucide-react';

export default function TopBar({ title, subtitle }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = t => t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate = t => t.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-time">
          <span style={{ color: 'var(--text-sec)' }}>{fmtDate(time)}</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600, marginLeft: 10 }}>{fmt(time)}</span>
        </div>
        <button className="notif-btn">
          <Bell size={16} />
          <span className="notif-dot" />
        </button>
      </div>
    </header>
  );
}
