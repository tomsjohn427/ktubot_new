import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ email:user?.email||'', semester:user?.semester||'', department:user?.department||'', currentPassword:'', newPassword:'' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });

  const handleSave = async (e) => {
    e.preventDefault(); setMsg({ type:'', text:'' }); setLoading(true);
    try {
      const payload = { email:form.email, semester:form.semester, department:form.department };
      if (form.newPassword) {
        if (!form.currentPassword) { setMsg({ type:'error', text:'Enter current password.' }); setLoading(false); return; }
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const res = await axios.put('/api/auth/profile', payload);
      updateUser(res.data?.user || { ...user, ...payload });
      setMsg({ type:'success', text:'Profile updated!' });
      setEditing(false);
      setForm(f=>({...f, currentPassword:'', newPassword:''}));
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.message||'Update failed.' });
    } finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login', { replace:true }); };

  return (
    <div className="page">
      <div className="page-inner">
        {/* Avatar */}
        <div className="fade-up" style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent3))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontFamily:'var(--font-display)', fontWeight:800, color:'#fff', margin:'0 auto 12px', boxShadow:'var(--glow)' }}>
            {(user?.username||'U')[0].toUpperCase()}
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800 }}>{user?.username}</h1>
          <p style={{ color:'var(--text3)', fontSize:13, marginTop:4 }}>{user?.email}</p>
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:10, flexWrap:'wrap' }}>
            <span className={`chip ${user?.role==='admin'?'chip-blue':'chip-purple'}`}>{user?.role||'student'}</span>
            {user?.department && <span className="chip chip-blue">{user.department}</span>}
            {user?.semester && <span className="chip chip-green">Sem {user.semester}</span>}
          </div>
        </div>

        {msg.text && <div className={`alert ${msg.type==='error'?'alert-error':'alert-success'} fade-up`}>{msg.text}</div>}

        <div className="card fade-up fade-up-delay-1" style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700 }}>Profile Details</h2>
            {!editing && <button className="btn btn-ghost" style={{ padding:'6px 14px', fontSize:13 }} onClick={()=>setEditing(true)}>Edit</button>}
          </div>

          {editing ? (
            <form onSubmit={handleSave}>
              <div style={{ marginBottom:14 }}>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label className="label">Department</label>
                  <select className="input" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} style={{ cursor:'pointer' }}>
                    <option value="">Select</option>
                    {['CSE','ECE','EEE','ME','CE','IT'].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Semester</label>
                  <select className="input" value={form.semester} onChange={e=>setForm(f=>({...f,semester:e.target.value}))} style={{ cursor:'pointer' }}>
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>
              <div className="divider" />
              <p style={{ fontSize:12, color:'var(--text3)', marginBottom:12 }}>Change password (optional)</p>
              <div style={{ marginBottom:14 }}>
                <label className="label">Current Password</label>
                <input className="input" type="password" placeholder="••••••••" value={form.currentPassword} onChange={e=>setForm(f=>({...f,currentPassword:e.target.value}))} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label className="label">New Password</label>
                <input className="input" type="password" placeholder="Min. 6 characters" value={form.newPassword} onChange={e=>setForm(f=>({...f,newPassword:e.target.value}))} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex:1, height:40 }}>
                  {loading ? <span className="spinner" style={{ width:16, height:16 }} /> : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={()=>{ setEditing(false); setMsg({type:'',text:''}); }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[{l:'Username',v:user?.username},{l:'Email',v:user?.email},{l:'Role',v:user?.role},{l:'Department',v:user?.department},{l:'Semester',v:user?.semester?`Semester ${user.semester}`:null}].filter(f=>f.v).map(f=>(
                <div key={f.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>{f.l}</span>
                  <span style={{ fontSize:14, color:'var(--text)', fontWeight:500 }}>{f.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card fade-up fade-up-delay-2">
          <button className="btn btn-danger" style={{ width:'100%', height:42 }} onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
