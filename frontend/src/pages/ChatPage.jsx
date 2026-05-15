import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// ── Marks mode config ─────────────────────────────────────────
const MARKS_OPTIONS = [
  { value: 'general', label: 'General',   icon: 'chat'          },
  { value: '3',       label: '3 Marks',   icon: 'looks_3'       },
  { value: '7',       label: '7 Marks',   icon: 'looks_one'     },
  { value: '14',      label: '14 Marks',  icon: 'military_tech' },
];

// ── Timestamp formatter ───────────────────────────────────────
const formatTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date} · ${time}`;
};

// ── Message component ─────────────────────────────────────────
// NOTE: No <style> block here — all styles are in index.css.
// Having styles inside a per-message component caused the fadeUp animation
// to replay on every keystroke in the input field.
function Message({ msg, isThinking }) {
  const isUser     = msg.role === 'user';
  const isNotFound = msg.content?.includes('Answer not found');

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 24,
      padding: '0 24px',
      animation: 'fadeUp 0.4s ease both',
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6c63ff, #38bdf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 12, flexShrink: 0,
        }}>
          <span
            className={`material-symbols-rounded ${isThinking ? 'spinning-ai' : ''}`}
            style={{ fontSize: '20px', color: '#fff' }}
          >
            {isThinking ? 'sync' : 'auto_awesome'}
          </span>
        </div>
      )}

      {/* Column: bubble + timestamp */}
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '80%' }}>
        <div style={{
          padding: isUser ? '12px 18px' : '0',
          borderRadius: '20px',
          background: isUser ? 'var(--bg3)' : 'transparent',
          color: isNotFound ? 'var(--danger)' : '#e8eaed',
          fontSize: '15px',
          lineHeight: 1.7,
          border: isUser ? '1px solid var(--border)' : 'none',
        }}>
          <div className="markdown-container">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Timestamp — hidden on the live thinking bubble */}
        {msg.createdAt && !isThinking && (
          <div style={{
            fontSize: 10,
            color: '#5f6368',
            marginTop: 4,
            textAlign: isUser ? 'right' : 'left',
            paddingLeft: isUser ? 0 : 4,
          }}>
            {formatTime(msg.createdAt)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ChatPage ──────────────────────────────────────────────────
export default function ChatPage() {
  const { subjectId, chatId: urlChatId } = useParams();
  const navigate      = useNavigate();

  const [subject,     setSubject]     = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [allChats,    setAllChats]    = useState([]);
  const [chatId,      setChatId]      = useState(null);
  const [marksMode,   setMarksMode]   = useState('general');

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  // ── Load subject + chat history for this subject ─────────────
  const init = useCallback(async () => {
    try {
      const [subRes, chatsRes] = await Promise.all([
        axios.get(`/api/subjects/${subjectId}`),
        axios.get('/api/chats'),
      ]);
      setSubject(subRes.data?.subject || subRes.data);

      // Sidebar: only chats belonging to this subject
      const allFetched = chatsRes.data?.chats || [];
      const subjectChats = allFetched.filter(c => {
        const cSubId = c.subjectId?._id || c.subjectId;
        return cSubId?.toString() === subjectId;
      });
      setAllChats(subjectChats);

      // If a specific chatId came from the URL, load that chat
      if (urlChatId) {
        const target = subjectChats.find(c => c._id === urlChatId);
        if (target) {
          setMessages(target.messages || []);
          setChatId(target._id);
          return;
        }
      }

      // Default: load the most recent chat for this subject
      try {
        const chatRes = await axios.get(`/api/chats/subject/${subjectId}`);
        if (chatRes.data?.chat) {
          setMessages(chatRes.data.chat.messages || []);
          setChatId(chatRes.data.chat._id);
        }
      } catch {
        // No existing chat — start fresh
        setMessages([]);
        setChatId(null);
      }
    } catch (err) { console.error(err); }
  }, [subjectId, urlChatId]);

  useEffect(() => { init(); }, [init]);

  // ── Send message ──────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setLoading(true);

    try {
      // Backend returns { chatId, reply, messages, title }
      const res = await axios.post('/api/chats/message', {
        subjectId,
        message: text,
        chatId: chatId || null,
        marksMode,
      });

      setChatId(res.data.chatId);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);

      // Refresh sidebar
      const history = await axios.get('/api/chats');
      const allFetched = history.data?.chats || [];
      setAllChats(allFetched.filter(c => {
        const cSubId = c.subjectId?._id || c.subjectId;
        return cSubId?.toString() === subjectId;
      }));
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Service error. Please try again.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  // ── New chat — creates a real session on the backend ─────────
  const startNewChat = async () => {
    try {
      const res = await axios.post('/api/chats/new', { subjectId });
      const newChat = res.data.chat;
      setChatId(newChat._id);
      setMessages([]);
      setMarksMode('general');
      setAllChats(prev => [newChat, ...prev.filter(c => c._id !== newChat._id)]);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  // ── Delete chat ───────────────────────────────────────────────
  const deleteChat = async (e, idToDelete) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await axios.delete(`/api/chats/${idToDelete}`);
      setAllChats(prev => prev.filter(c => c._id !== idToDelete));
      if (chatId === idToDelete) {
        setMessages([]);
        setChatId(null);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      alert('Failed to delete chat. Please try again.');
    }
  };

  // ── Switch to an existing chat from the sidebar ───────────────
  const switchChat = (chat) => {
    setChatId(chat._id);
    setMessages(chat.messages || []);
    setMarksMode('general');
  };

  return (
    <div className="chat-page-container">

      {/* ── SIDEBAR ── */}
      <div style={{
        width: showSidebar ? '280px' : '0px',
        borderRight: showSidebar ? '1px solid var(--border)' : 'none',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        background: 'var(--bg2)',
        flexShrink: 0,
      }}>
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', height: '100%' }}>

          <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#bdc1c6', fontWeight: 600, letterSpacing: '0.05em', fontSize: '13px', textTransform: 'uppercase' }}>
              Chats
            </span>
            <button onClick={() => setShowSidebar(false)} className="btn-ghost" style={{ border: 'none', cursor: 'pointer', display: 'flex' }}>
              <span className="material-symbols-rounded" style={{ color: '#9aa0a6' }}>menu_open</span>
            </button>
          </div>

          <button
            onClick={startNewChat}
            style={{ margin: '0 16px 20px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#e8eaed', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>add</span>
            New chat
          </button>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
            {allChats.length === 0 ? (
              <p style={{ color: '#5f6368', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
                No history for {subject?.name || 'this subject'} yet
              </p>
            ) : allChats.map(chat => {
              // Use saved title, fallback to first user message content
              const label = chat.title && chat.title !== 'New Chat'
                ? chat.title
                : (chat.messages?.find(m => m.role === 'user')?.content || 'New Chat');
              const isActive = chat._id === chatId;
              return (
                <div
                  key={chat._id}
                  onClick={() => switchChat(chat)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', marginBottom: '4px', background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent', border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent', transition: 'background 0.2s' }}
                >
                  <div style={{ color: isActive ? '#fff' : '#bdc1c6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px', flex: 1, paddingRight: '8px' }}>
                    {label}
                  </div>
                  <button
                    onClick={e => deleteChat(e, chat._id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '6px', opacity: isActive ? 1 : 0.6, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.opacity = isActive ? '1' : '0.6'; }}
                    title="Delete Chat"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>delete</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN CHAT WINDOW ── */}
      <div className="main-chat-window">

        {/* Header */}
        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
          {!showSidebar && (
            <button onClick={() => setShowSidebar(true)} className="btn-ghost" style={{ border: 'none', cursor: 'pointer', display: 'flex' }}>
              <span className="material-symbols-rounded" style={{ color: '#9aa0a6' }}>menu</span>
            </button>
          )}
          <h2 style={{ color: '#e8eaed', fontSize: '16px', fontWeight: 500 }}>{subject?.name}</h2>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '18vh', padding: '0 20px' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '64px', color: 'var(--accent)', marginBottom: 24, opacity: 0.8 }}>auto_awesome</span>
              <h1 style={{ color: '#e8eaed', fontSize: '32px', fontWeight: 700, marginBottom: 12 }}>How can I help you today?</h1>
              <p style={{ color: '#9aa0a6', fontSize: '16px', maxWidth: '450px', margin: '0 auto' }}>
                Ask me anything about your <strong>{subject?.name}</strong> notes.
              </p>
            </div>
          ) : (
            <>
              {messages.map((m, i) => <Message key={i} msg={m} />)}
              {loading && <Message msg={{ role: 'assistant', content: '...' }} isThinking={true} />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: '20px 24px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>

          {/* Marks mode selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {MARKS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setMarksMode(opt.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: marksMode === opt.value ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: marksMode === opt.value ? 'rgba(108, 99, 255, 0.15)' : 'transparent',
                  color: marksMode === opt.value ? 'var(--accent)' : '#9aa0a6',
                  fontSize: '12px',
                  fontWeight: marksMode === opt.value ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Text input */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, background: 'var(--bg3)', borderRadius: '28px', padding: '10px 20px', border: '1px solid var(--border)' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Ask KTUBot${marksMode !== 'general' ? ` (${marksMode}-mark answer)` : ''}...`}
              style={{ flex: 1, background: 'none', border: 'none', color: '#e8eaed', outline: 'none', resize: 'none', padding: '8px 0', fontSize: '16px', maxHeight: '180px' }}
              rows={1}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{ background: 'none', border: 'none', color: input.trim() ? 'var(--accent)' : '#5f6368', cursor: input.trim() ? 'pointer' : 'default' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '30px' }}>send</span>
            </button>
          </div>

          <p style={{ fontSize: '11px', color: '#5f6368', textAlign: 'center', marginTop: 14 }}>
            KTUBot extracts answers directly from your KTU notes. Always verify important topics.
          </p>
        </div>
      </div>
    </div>
  );
}