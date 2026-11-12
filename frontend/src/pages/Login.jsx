import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Eye, EyeOff, LogIn, ShieldCheck, Package, BarChart3 } from 'lucide-react';

const floatingIcons = ['👟','👠','👞','🥾','👢','🩴','👡','🥿','⛸️','🩰'];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch {
      setError('Invalid username or password. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-bg">
      {/* Animated floating shoe emojis */}
      <div className="login-particles">
        {floatingIcons.map((icon, i) => (
          <span key={i} className="particle" style={{
            left: `${8 + (i * 9)}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${12 + (i % 5) * 3}s`,
            fontSize: `${18 + (i % 4) * 8}px`,
            opacity: 0.15 + (i % 3) * 0.08,
          }}>{icon}</span>
        ))}
      </div>

      {/* Animated gradient orbs */}
      <div className="login-orb orb-1"></div>
      <div className="login-orb orb-2"></div>
      <div className="login-orb orb-3"></div>

      <div className={`login-card ${mounted ? 'login-card-enter' : ''}`}>
        {/* Brand header */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <span className="brand-shoe">👟</span>
          </div>
          <h1 className="login-brand-name">Footwear Retail</h1>
          <p className="login-brand-sub">MANAGEMENT SYSTEM</p>
          <div className="login-brand-line"></div>
        </div>

        <p className="login-welcome">Welcome back! Sign in to continue.</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required autoFocus
            />
          </div>
          <div className="login-field" style={{ position: 'relative' }}>
            <label>Password</label>
            <input
              type={show ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              style={{ paddingRight: 42 }}
            />
            <button type="button" onClick={() => setShow(!show)}
              className="login-eye-btn">
              {show ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <><span className="login-spinner"></span> Signing in...</>
            ) : (
              <><LogIn size={16} /> Sign In</>
            )}
          </button>
        </form>

        {/* Feature badges */}
        <div className="login-features">
          <div className="login-feature"><ShieldCheck size={13}/> Secure</div>
          <div className="login-feature"><Package size={13}/> Inventory</div>
          <div className="login-feature"><BarChart3 size={13}/> Analytics</div>
        </div>

        <p className="login-footer">© 2024 Footwear Retail Management System</p>
      </div>
    </div>
  );
}
