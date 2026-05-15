import PdfUploadWithProgress from '../components/PdfUploadWithProgress';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [stats, setStats] = useState({});
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/stats').catch(()=>({ data:{ stats:{} } })),
      axios.get('/api/admin/chats?limit=5').catch(()=>({ data:{ chats:[] } })),
    ]).then(([s,c]) => {
      setStats(s.data?.stats || {});
      setRecentChats(c.data?.chats || []);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon:'👥', label:'Users',    value:stats.users    ?? 0, color:'var(--accent2)' },
    { icon:'📚', label:'Subjects', value:stats.subjects ?? 0, color:'var(--accent3)' },
    { icon:'📄', label:'Notes',    value:stats.notes    ?? 0, color:'var(--success)'  },
    { icon:'💬', label:'Chats',    value:stats.chats    ?? 0, color:'var(--warning)'  },
  ];

  return (
    <div className="page">
      <div className="page-inner">
        <div className="fade-up" style={{ marginBottom:24 }}>
          <p style={{ color:'var(--text3)', fontSize:13 }}>Admin Panel</p>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, background:'linear-gradient(135deg,var(--text),var(--accent3))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Dashboard</h1>
          <p style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>Welcome, {user?.username}</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
          {statCards.map((s,i) => (
            <div key={i} className={`card fade-up`} style={{ animationDelay:`${i*0.05}s`, padding:16, textAlign:'center', borderLeft:`3px solid ${s.color}` }}>
              <div style={{ fontSize:26, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:24, fontFamily:'var(--font-display)', fontWeight:800, color:s.color }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="fade-up fade-up-delay-2" style={{ marginBottom:24 }}>
          <h2 className="section-title">Quick Actions</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <button className="btn btn-secondary" style={{ height:48 }} onClick={()=>navigate('/admin/manage')}>📚 Manage App</button>
            <button className="btn btn-secondary" style={{ height:48 }} onClick={()=>navigate('/profile')}>👤 My Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
}