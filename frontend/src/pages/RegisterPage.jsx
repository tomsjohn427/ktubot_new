import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username:'', email:'', password:'', confirmPassword:'', semester:'1', department:'' });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.username || !form.email || !form.password) { setError('Fill in all required fields.'); return; }
    if (!form.department) { setError('Please select your department.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register({ username:form.username, email:form.email, password:form.password, semester:parseInt(form.semester), department:form.department });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', background:'var(--bg)', overflowY:'auto' }}>
      <div className="fade-up" style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,var(--accent),var(--accent3))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:24 }}>🎓</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, background:'linear-gradient(135deg,var(--text),var(--accent2))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Create Account</h1>
          <p style={{ color:'var(--text3)', fontSize:13, marginTop:4 }}>Join KTU Bot as a student</p>
        </div>
        <div className="card" style={{ padding:28 }}>
          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:14 }}>
              <label className="label">Username *</label>
              <input className="input" placeholder="username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label className="label">Department *</label>
                <select className="input" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} style={{ cursor:'pointer' }}>
                  <option value="">Select</option>
                  {['CSE','ECE','EEE','ME','CE','IT'].map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Semester *</label>
                <select className="input" value={form.semester} onChange={e=>setForm(f=>({...f,semester:e.target.value}))} style={{ cursor:'pointer' }}>
                  {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label className="label">Password *</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
            </div>
            <div style={{ marginBottom:24 }}>
              <label className="label">Confirm Password *</label>
              <input className="input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e=>setForm(f=>({...f,confirmPassword:e.target.value}))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading||!!success} style={{ width:'100%', height:44, fontSize:15 }}>
              {loading ? <span className="spinner" style={{ width:18, height:18 }} /> : 'Create Account'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign:'center', fontSize:13, color:'var(--text3)' }}>Already have an account? <Link to="/login" style={{ color:'var(--accent2)', textDecoration:'none', fontWeight:500 }}>Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
