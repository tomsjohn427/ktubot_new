import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StudentNav = [
  { to: '/home', label: 'Home', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { to: '/subjects', label: 'Subjects', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { to: '/chats', label: 'Chats', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { to: '/profile', label: 'Profile', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

const AdminNav = [
  { to: '/admin', label: 'Dashboard', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { to: '/admin/manage', label: 'Manage', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 1 0 4.93 19.07 10 10 0 0 0 19.07 4.93z"/></svg> },
  { to: '/profile', label: 'Profile', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  if (location.pathname.startsWith('/chat/')) return null;
  const navItems = user?.role === 'admin' ? AdminNav : StudentNav;

  return (
    <nav style={{ height:'var(--nav-height)', background:'rgba(17,17,24,0.95)', backdropFilter:'blur(20px)', borderTop:'1px solid var(--border)', display:'flex', alignItems:'stretch', flexShrink:0, zIndex:100 }}>
      {navItems.map(item => (
        <NavLink key={item.to} to={item.to} style={({ isActive }) => ({ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, textDecoration:'none', color: isActive ? 'var(--accent2)' : 'var(--text3)', transition:'color 0.2s', padding:'6px 0' })}>
          {({ isActive }) => (
            <>
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>{item.icon(isActive)}</span>
              <span style={{ fontSize:10, fontWeight: isActive ? 600 : 400, letterSpacing:'0.03em' }}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
