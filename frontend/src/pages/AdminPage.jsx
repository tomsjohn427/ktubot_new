import PdfUploadWithProgress from '../components/PdfUploadWithProgress';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const DEPTS = ['CSE','ECE','EEE','ME','CE','IT'];

// ────────────────────────────────────────────────────────────────
// SUBJECTS TAB
// ────────────────────────────────────────────────────────────────
function SubjectsTab() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm] = useState({ name:'', code:'', description:'', semester:'1', department:'CSE' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem]   = useState('');

  const load = async () => {
    try {
      // Admin gets all subjects — query all
      const res = await axios.get('/api/subjects');
      setSubjects(res.data?.subjects || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ name:'', code:'', description:'', semester:'1', department:'CSE' }); setEditId(null); setShowForm(false); setMsg({ type:'', text:'' }); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg({ type:'', text:'' });
    if (!form.name) { setMsg({ type:'error', text:'Subject name is required.' }); return; }
    setSaving(true);
    try {
      if (editId) { await axios.put(`/api/subjects/${editId}`, form); setMsg({ type:'success', text:'Updated!' }); }
      else { await axios.post('/api/subjects', form); setMsg({ type:'success', text:'Subject added!' }); }
      resetForm(); load();
    } catch (err) { setMsg({ type:'error', text: err?.response?.data?.message||'Failed.' }); }
    finally { setSaving(false); }
  };

  const handleEdit = (s) => {
    setForm({ name:s.name, code:s.code||'', description:s.description||'', semester:String(s.semester||1), department:s.department||'CSE' });
    setEditId(s._id); setShowForm(true);
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject + all its notes & chats?')) return;
    try { await axios.delete(`/api/subjects/${id}`); load(); } catch { alert('Failed.'); }
  };

  const filtered = subjects.filter(s =>
    (!filterDept || s.department === filterDept) &&
    (!filterSem  || String(s.semester) === filterSem)
  );

  return (
    <div>
      {!showForm ? (
        <button className="btn btn-primary" style={{ marginBottom:16, height:40 }} onClick={() => setShowForm(true)}>+ Add Subject</button>
      ) : (
        <div className="card" style={{ marginBottom:16 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:16 }}>{editId ? 'Edit Subject' : 'Add Subject'}</h3>
          {msg.text && <div className={`alert ${msg.type==='error'?'alert-error':'alert-success'}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label className="label">Department *</label>
                <select className="input" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} style={{ cursor:'pointer' }}>
                  {DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Semester *</label>
                <select className="input" value={form.semester} onChange={e=>setForm(f=>({...f,semester:e.target.value}))} style={{ cursor:'pointer' }}>
                  {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label className="label">Subject Name *</label>
                <input className="input" placeholder="e.g. Data Structures" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div>
                <label className="label">Subject Code</label>
                <input className="input" placeholder="e.g. CS301" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} />
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label className="label">Description</label>
              <textarea className="input" rows={2} placeholder="Short description..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{ resize:'vertical' }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex:1, height:40 }}>
                {saving ? <span className="spinner" style={{ width:16, height:16 }} /> : editId ? 'Update' : 'Add Subject'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <select className="input" style={{ flex:1, minWidth:120, cursor:'pointer' }} value={filterDept} onChange={e=>setFilterDept(e.target.value)}>
          <option value="">All Depts</option>
          {DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select className="input" style={{ flex:1, minWidth:120, cursor:'pointer' }} value={filterSem} onChange={e=>setFilterSem(e.target.value)}>
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Sem {s}</option>)}
        </select>
      </div>

      {loading ? <div style={{ display:'flex', justifyContent:'center', padding:32 }}><div className="spinner" /></div>
      : filtered.length === 0 ? <div className="empty-state"><div className="icon">📚</div><p>No subjects found.</p></div>
      : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map((s,i) => (
            <div key={s._id||i} className="card" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700 }}>{s.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, display:'flex', gap:6 }}>
                  <span className="chip chip-blue">{s.department}</span>
                  <span className="chip chip-purple">S{s.semester}</span>
                  {s.code && <span style={{ color:'var(--text3)' }}>{s.code}</span>}
                </div>
              </div>
              <button className="btn btn-ghost" style={{ padding:'6px 12px', fontSize:12 }} onClick={()=>handleEdit(s)}>Edit</button>
              <button className="btn btn-danger" style={{ padding:'6px 10px' }} onClick={()=>handleDelete(s._id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// NOTES (PDF UPLOAD) TAB
// ────────────────────────────────────────────────────────────────
function NotesTab() {
  const [subjects, setSubjects]       = useState([]);
  const [notes, setNotes]             = useState([]);
  const [loadingSub, setLoadingSub]   = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // We only need basic form data now, the Progress component handles the file
  const [form, setForm] = useState({ department:'CSE', semester:'1', subjectId:'', moduleNumber:'1', moduleName:'' });
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem]   = useState('');

  useEffect(() => {
    axios.get('/api/subjects').then(r => setSubjects(r.data?.subjects || [])).catch(()=>{}).finally(()=>setLoadingSub(false));
  }, []);

  const loadNotes = async () => {
    setLoadingNotes(true);
    try {
      const params = new URLSearchParams();
      if (filterDept) params.append('department', filterDept);
      if (filterSem)  params.append('semester', filterSem);
      const res = await axios.get(`/api/notes?${params}`);
      setNotes(res.data?.notes || []);
    } catch {} finally { setLoadingNotes(false); }
  };

  useEffect(() => { loadNotes(); }, [filterDept, filterSem]);

  // Subjects filtered by selected dept+semester
  const filteredSubjects = subjects.filter(s =>
    s.department === form.department && String(s.semester) === String(form.semester)
  );

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Delete this note and all its data?')) return;
    try { await axios.delete(`/api/notes/${id}`); loadNotes(); } catch { alert('Failed.'); }
  };

  return (
    <div>
      {/* Upload Form Area */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:4 }}>Upload PDF Notes</h3>
        <p style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Select department, semester, subject and module before uploading.</p>

        {/* Step 1: Dept + Semester */}
        <div style={{ background:'var(--bg3)', borderRadius:'var(--radius-sm)', padding:14, marginBottom:14 }}>
          <p style={{ fontSize:11, color:'var(--accent2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Step 1 — Select Target</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value,subjectId:''}))} style={{ cursor:'pointer' }}>
                {DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Semester</label>
              <select className="input" value={form.semester} onChange={e=>setForm(f=>({...f,semester:e.target.value,subjectId:''}))} style={{ cursor:'pointer' }}>
                {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Subject + Module */}
        <div style={{ background:'var(--bg3)', borderRadius:'var(--radius-sm)', padding:14, marginBottom:14 }}>
          <p style={{ fontSize:11, color:'var(--accent3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Step 2 — Select Subject & Module</p>
          <div style={{ marginBottom:12 }}>
            <label className="label">Subject *</label>
            {loadingSub ? <div className="input" style={{ color:'var(--text3)' }}>Loading subjects...</div>
            : filteredSubjects.length === 0
              ? <div style={{ padding:'10px 14px', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--danger)' }}>
                  No subjects found for {form.department} Sem {form.semester}. Add a subject first.
                </div>
              : <select className="input" value={form.subjectId} onChange={e=>setForm(f=>({...f,subjectId:e.target.value}))} style={{ cursor:'pointer' }}>
                  <option value="">-- Select subject --</option>
                  {filteredSubjects.map(s=><option key={s._id} value={s._id}>{s.name}{s.code?` (${s.code})`:''}</option>)}
                </select>
            }
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12 }}>
            <div>
              <label className="label">Module No. *</label>
              <select className="input" value={form.moduleNumber} onChange={e=>setForm(f=>({...f,moduleNumber:e.target.value}))} style={{ cursor:'pointer' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>Module {n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Module Name</label>
              <input className="input" placeholder={`e.g. Introduction to Algorithms`} value={form.moduleName} onChange={e=>setForm(f=>({...f,moduleName:e.target.value}))} />
            </div>
          </div>
        </div>

        {/* Step 3: THE NEW PROGRESS UPLOAD COMPONENT */}
        <div style={{ background:'var(--bg3)', borderRadius:'var(--radius-sm)', padding:14, marginBottom:16 }}>
          <p style={{ fontSize:11, color:'var(--success)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Step 3 — Upload PDF</p>
          
          {/* We pass all the form data as props to the component so it can send them to the backend */}
          <PdfUploadWithProgress 
            subjectId={form.subjectId} 
            moduleNumber={form.moduleNumber}
            moduleName={form.moduleName}
            onUploadComplete={loadNotes} // Reload the notes list when done!
          />
        </div>
      </div>

      {/* Notes list (Unchanged) */}
      <div>
        <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, flex:1 }}>Uploaded Notes</h3>
          <select className="input" style={{ width:120, cursor:'pointer' }} value={filterDept} onChange={e=>setFilterDept(e.target.value)}>
            <option value="">All Depts</option>
            {DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
          <select className="input" style={{ width:120, cursor:'pointer' }} value={filterSem} onChange={e=>setFilterSem(e.target.value)}>
            <option value="">All Sems</option>
            {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Sem {s}</option>)}
          </select>
        </div>

        {loadingNotes ? <div style={{ display:'flex', justifyContent:'center', padding:24 }}><div className="spinner" /></div>
        : notes.length === 0 ? <div className="empty-state" style={{ padding:24 }}><div className="icon" style={{ fontSize:32 }}>📄</div><p>No notes uploaded yet.</p></div>
        : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {notes.map((n,i) => (
              <div key={n._id||i} className="card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:24, flexShrink:0 }}>📄</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {n.subjectId?.name || 'Subject'} — M{n.moduleNumber}: {n.moduleName}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, display:'flex', gap:6, flexWrap:'wrap' }}>
                    <span className="chip chip-blue">{n.department}</span>
                    <span className="chip chip-purple">S{n.semester}</span>
                    <span className={`chip ${n.processed ? 'chip-green' : 'chip-orange'}`}>{n.processed ? '✓ Processed' : '⏳ Processing'}</span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{n.originalName}</div>
                </div>
                <button className="btn btn-danger" style={{ padding:'6px 10px', flexShrink:0 }} onClick={()=>handleDeleteNote(n._id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// MAIN AdminPage
// ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState('notes');
  const tabs = [
    { id:'notes',    label:'📄 Notes'    },
    { id:'subjects', label:'📚 Subjects' },
  ];

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-header fade-up">
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800 }}>Manage</h1>
        </div>

        {/* Tabs */}
        <div className="fade-up fade-up-delay-1" style={{ display:'flex', gap:4, marginBottom:20, background:'var(--surface)', borderRadius:10, padding:4 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ flex:1, padding:'8px 6px', borderRadius:8, border:'none', background: tab===t.id ? 'var(--accent)' : 'transparent', color: tab===t.id ? '#fff' : 'var(--text3)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.2s', boxShadow: tab===t.id ? '0 2px 8px rgba(108,99,255,0.4)' : 'none', whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="fade-up fade-up-delay-2">
          {tab==='notes'    && <NotesTab />}
          {tab==='subjects' && <SubjectsTab />}
        </div>
      </div>
    </div>
  );
}