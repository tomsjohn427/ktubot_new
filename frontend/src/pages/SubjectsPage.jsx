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

export default function SubjectsPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    axios.get('/api/subjects')
      .then(r => setSubjects(r.data?.subjects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = subjects.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-inner">
        
        {/* ── HEADER ── */}
        <div className="page-header fade-up" style={{ marginBottom: 32 }}>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '32px', 
            fontWeight: 800, 
            color: '#e8eaed' // Dim White
          }}>
            Subjects
          </h1>
          {user?.department && user?.semester && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span className="chip" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent3)', border: '1px solid rgba(56,189,248,0.2)' }}>
                {user.department}
              </span>
              <span className="chip" style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--accent2)', border: '1px solid rgba(108,99,255,0.2)' }}>
                S{user.semester}
              </span>
            </div>
          )}
        </div>

        {/* ── SEARCH BAR ── */}
        <div className="fade-up fade-up-delay-1" style={{ marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-rounded" style={{ 
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', 
              color: '#9aa0a6', fontSize: '20px' 
            }}>
              search
            </span>
            <input 
              className="input" 
              style={{ paddingLeft: 44, height: 50, borderRadius: '16px', background: 'var(--bg3)', color: '#e8eaed' }} 
              placeholder="Search subjects..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {/* ── SUBJECT LIST ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-rounded" style={{ fontSize: '48px', color: '#606080', marginBottom: 12 }}>book_5</span>
            <p style={{ color: '#9aa0a6' }}>{search ? 'No subjects match your search.' : 'No subjects available.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((s, i) => (
              <div 
                key={s._id || i} 
                className="card fade-up" 
                style={{ 
                  animationDelay: `${i * 0.05}s`, display: 'flex', alignItems: 'center', gap: 16, 
                  cursor: 'pointer', padding: '16px 20px', borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)'
                }}
                onClick={() => navigate(`/chat/${s._id}`)}
              >
                {/* Modern Material Symbol Container */}
                <div style={{ 
                  width: 48, height: 48, borderRadius: '14px', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  <span className="material-symbols-rounded" style={{ color: 'var(--accent)', fontSize: '28px' }}>
                    book_5
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: '#e8eaed' }}>
                      {s.name}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#9aa0a6' }}>{s.code || 'NO CODE'}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#606080' }}></span>
                    <span style={{ fontSize: '12px', color: '#9aa0a6' }}>S{s.semester}</span>
                  </div>
                </div>

                <span className="material-symbols-rounded" style={{ color: '#80868b' }}>chevron_right</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}