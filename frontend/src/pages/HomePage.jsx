import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const COLORS = [
  'linear-gradient(135deg,#6c63ff,#a78bfa)',
  'linear-gradient(135deg,#38bdf8,#818cf8)',
  'linear-gradient(135deg,#34d399,#38bdf8)',
  'linear-gradient(135deg,#fbbf24,#f87171)',
  'linear-gradient(135deg,#f472b6,#c084fc)',
  'linear-gradient(135deg,#fb923c,#fbbf24)',
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          axios.get('/api/subjects'),
          axios.get('/api/chats'),
        ]);
        setSubjects(sRes.data?.subjects || []);
        setRecentChats((cRes.data?.chats || []).slice(0, 3));
      } catch {
        setError('Failed to load data.');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = subjects.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  );

  const missingProfile = !user?.department || !user?.semester;

  return (
    <div className="page">
      <div className="page-inner">

        {/* 1. Profile Header - Gemini Dim Style */}
        <div className="fade-up" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <p style={{ color: '#bdc1c6', fontSize: '22px', fontWeight: 500, marginBottom: 6 }}>
              Good day,
            </p>
            <h1 style={{ 
              fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 800, 
              color: '#e8eaed', lineHeight: 1.1, letterSpacing: '-0.02em' 
            }}>
              {user?.username || 'Anjana M H'} 
              <span style={{ display: 'inline-block', marginLeft: '12px', fontSize: '30px' }}>👋</span>
            </h1>
            {user?.department && user?.semester && (
              <p style={{ color: '#9aa0a6', fontSize: '18px', marginTop: 8, fontWeight: 400 }}>
                {user.department} • Semester {user.semester}
              </p>
            )}
          </div>

          <button onClick={() => navigate('/profile')} style={{ 
            width: 56, height: 56, borderRadius: '18px', background: 'rgba(255, 255, 255, 0.04)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', cursor: 'pointer', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' 
          }}>
             <span className="material-symbols-rounded" style={{ color: 'var(--accent)', fontSize: '24px' }}>person</span>
          </button>
        </div>

        {/* 2. Warning Section */}
        {missingProfile && (
          <div className="fade-up" style={{ background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:'var(--radius)', padding:'14px 18px', marginBottom:24, fontSize:13, color:'#bdc1c6' }}>
            ⚠️ <strong style={{ color: '#e8eaed' }}>Profile Incomplete:</strong> <span style={{ textDecoration:'underline', cursor:'pointer' }} onClick={() => navigate('/profile')}>Update settings</span>.
          </div>
        )}

        {/* 3. Search Bar */}
        <div className="fade-up fade-up-delay-1" style={{ marginBottom:32 }}>
          <div style={{ position:'relative' }}>
            <span className="material-symbols-rounded" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#9aa0a6', fontSize: '20px' }}>search</span>
            <input className="input" style={{ paddingLeft:44, height: 50, borderRadius: '16px', background: 'var(--bg3)', color: '#e8eaed', border: '1px solid var(--border)' }} placeholder="Search your subjects..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        {/* 4. MODERN GRID UI - Subject Cards */}
        <div className="fade-up fade-up-delay-2">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <h2 className="section-title" style={{ margin:0, color: '#bdc1c6', fontSize: '18px', fontWeight: 600 }}>Your Subjects</h2>
            <span style={{ fontSize:12, color:'#80868b' }}>{filtered.length} found</span>
          </div>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="spinner" /></div>
          ) : (
            <div className="grid-container">
              {filtered.map((subject, i) => (
                <div 
                  key={subject._id} 
                  className="category-card" 
                  onClick={() => navigate(`/chat/${subject._id}`)}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="category-icon" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <span className="material-symbols-rounded" style={{ color: COLORS[i % COLORS.length].split(',')[1], fontSize: '28px' }}>book_2</span>
                  </div>
                  <div className="category-label" style={{ marginTop: 8, color: '#e8eaed' }}>{subject.name}</div>
                  <div style={{ fontSize: '11px', color: '#9aa0a6' }}>{subject.code || `S${subject.semester}`}</div>
                </div>
              ))}

              <div className="category-card" onClick={() => navigate('/subjects')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div className="category-icon" style={{ background: 'transparent' }}>
                  <span className="material-symbols-rounded" style={{ color: '#bdc1c6', fontSize: '28px' }}>folder_open</span>
                </div>
                <div className="category-label" style={{ color: '#bdc1c6' }}>View All</div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Recent Activity */}
        {recentChats.length > 0 && (
          <div className="fade-up fade-up-delay-3" style={{ marginTop: 36 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h2 className="section-title" style={{ margin:0, color: '#bdc1c6', fontSize: '18px', fontWeight: 600 }}>Recent Conversations</h2>
              <button onClick={() => navigate('/chats')} style={{ background:'none', border:'none', color:'var(--accent2)', fontSize:12, cursor:'pointer', fontWeight: 600 }}>See History</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {recentChats.map((chat, i) => (
                <div key={chat._id || i} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16, borderRadius: '20px', cursor:'pointer', background: 'rgba(255,255,255,0.03)' }}
                  onClick={() => navigate(`/chat/${chat.subjectId?._id || chat.subjectId}`)}>
                  <div style={{ width:42, height:42, borderRadius:14, background: 'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span className="material-symbols-rounded" style={{ color: COLORS[(i + 2) % COLORS.length].split(',')[1], fontSize: '20px' }}>chat_bubble</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color: '#e8eaed', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {chat.subjectId?.name || 'Subject'}
                    </div>
                    <div style={{ fontSize:12, color:'#9aa0a6', marginTop: 2 }}>{chat.messages?.length || 0} messages • Active now</div>
                  </div>
                  <span className="material-symbols-rounded" style={{ color: '#80868b', fontSize: '20px' }}>chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}