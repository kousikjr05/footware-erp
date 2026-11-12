import React from 'react';

export default function StatCard({ label, value, icon, color = 'blue', badge, badgeType = 'up', prefix = '', suffix = '' }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-top">
        <div className={`stat-icon ${color}`}>{icon}</div>
        {badge !== undefined && (
          <span className={`stat-badge ${badgeType}`}>{badge}</span>
        )}
      </div>
      <div className="stat-value">{prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
