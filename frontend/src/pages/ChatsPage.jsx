import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ChatsPage() {
  const [chats,   setChats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/chats')
      .then(res => setChats(res.data?.chats || []))
      .catch(err => console.error('Failed to load chats', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await axios.delete(`/api/chats/${id}`);
      setChats(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.error('Failed to delete chat:', err);
      alert('Failed to delete. Please try again.');
    }
  };

  return (
    <div className="page">
      <div className="page-inner">

        <div className="page-header fade-up" style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: '#e8eaed' }}>
            Chat History
          </h1>
          <p style={{ color: '#9aa0a6', fontSize: '13px', marginTop: 4 }}>
            All your past conversations across subjects
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : chats.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '8vh', color: '#9aa0a6' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '48px', opacity: 0.5, display: 'block', marginBottom: 12 }}>chat_bubble</span>
            <p>No conversations yet. Start chatting from Subjects!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chats.map((chat, i) => {
              const subjectName = chat.subjectId?.name || 'Unknown Subject';
              const label       = chat.title && chat.title !== 'New Chat'
                ? chat.title
                : (chat.messages?.find(m => m.role === 'user')?.content || 'New Chat');
              const subjectId   = chat.subjectId?._id || chat.subjectId;
              const chatId      = chat._id;
              const msgCount    = chat.messages?.length || 0;
              const updatedAt   = chat.updatedAt
                ? new Date(chat.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '';

              return (
                <div
                  key={chat._id || i}
                  className="card fade-up"
                  style={{ animationDelay: `${i * 0.04}s`, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}
                  onClick={() => navigate(`/chat/${subjectId}/${chatId}`)}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-rounded" style={{ color: 'var(--accent2)', fontSize: '22px' }}>chat_bubble</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: '#e8eaed', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {subjectName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9aa0a6', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#5f6368', marginTop: 2 }}>
                      {msgCount} messages{updatedAt ? ` · ${updatedAt}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={e => handleDelete(e, chat._id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '8px', opacity: 0.6, transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.opacity = '0.6'; }}
                      title="Delete"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                    <span className="material-symbols-rounded" style={{ color: '#80868b', fontSize: '20px' }}>chevron_right</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}