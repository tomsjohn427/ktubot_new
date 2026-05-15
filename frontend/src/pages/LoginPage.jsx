import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.username || !form.password) { setError('Fill in all fields.'); return; }
    setLoading(true);
    try {
      const u = await login(form.username, form.password);
      navigate(u.role === 'admin' ? '/admin' : '/home', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', background:'var(--bg)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-20%', left:'50%', transform:'translateX(-50%)', width:500, height:500, background:'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div className="fade-up" style={{ width:'100%', maxWidth:400, position:'relative' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(135deg,var(--accent),var(--accent3))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'var(--glow)', fontSize:28 }}>🤖</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:800, letterSpacing:'-0.02em', background:'linear-gradient(135deg,var(--text),var(--accent2))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>KTU Bot</h1>
          <p style={{ color:'var(--text3)', fontSize:13, marginTop:4 }}>Your AI-powered academic assistant</p>
        </div>
        <div className="card" style={{ padding:28 }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, marginBottom:6 }}>Welcome back</h2>
          <p style={{ color:'var(--text3)', fontSize:13, marginBottom:24 }}>Sign in as student or admin</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label className="label">Username</label>
              <input className="input" name="username" placeholder="Enter your username" value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} autoFocus />
            </div>
            <div style={{ marginBottom:24 }}>
              <label className="label">Password</label>
              <input className="input" name="password" type="password" placeholder="Enter your password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', height:44, fontSize:15 }}>
              {loading ? <span className="spinner" style={{ width:18, height:18 }} /> : 'Sign In'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign:'center', fontSize:13, color:'var(--text3)' }}>New student? <Link to="/register" style={{ color:'var(--accent2)', textDecoration:'none', fontWeight:500 }}>Create account</Link></p>
        </div>
        <p style={{ textAlign:'center', fontSize:11, color:'var(--text3)', marginTop:16 }}>Admin accounts are managed by the institution</p>
      </div>
    </div>
  );
}
