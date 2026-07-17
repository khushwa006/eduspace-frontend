import { useState, useEffect } from 'react';
import './SkillSharing.css';

const CAT_ICONS = { Programming:'💻', Music:'🎵', Arts:'🎨', Languages:'🌍', Science:'🔬', Sports:'⚽', Other:'✨' };
const PROF_CONFIG = { beginner:{label:'Beginner',color:'#f59e0b'}, intermediate:{label:'Intermediate',color:'#3b82f6'}, expert:{label:'Expert',color:'#10b981'} };
const TABS = ['My Skills','Matches','Directory','🏆 Team Up'];

const API = 'https://eduspace-backend-bh29.onrender.com';
const headers = () => ({ 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`, 'Content-Type': 'application/json' });
const get  = (url) => fetch(API+url,{headers:headers()}).then(r=>r.json());
const post = (url,body) => fetch(API+url,{method:'POST',headers:headers(),body:JSON.stringify(body)}).then(r=>r.json());
const del  = (url) => fetch(API+url,{method:'DELETE',headers:headers()}).then(r=>r.json());

export default function SkillSharing() {
  const [tab, setTab]             = useState('My Skills');
  const [allSkills, setAllSkills] = useState([]);
  const [mySkills, setMySkills]   = useState([]);
  const [matches, setMatches]     = useState([]);
  const [directory, setDirectory] = useState([]);
  const [teams, setTeams]         = useState([]);
  const [myTeams, setMyTeams]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [catFilter, setCatFilter] = useState('All');
  const [search, setSearch]       = useState('');
  const [dirSearch, setDirSearch] = useState('');
  const [msg, setMsg]             = useState('');
  const userId = parseInt(localStorage.getItem('userId')||'0');

  // Add skill form
  const [addType, setAddType]   = useState('teach');
  const [addSkill, setAddSkill] = useState('');
  const [addProf, setAddProf]   = useState('intermediate');
  // Team form
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamForm, setTeamForm] = useState({title:'',event_name:'',event_date:'',description:'',required_skills:'',team_size:4});
  const [applyMsg, setApplyMsg] = useState({});

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''), 3500); };

  const loadAll = async () => {
    setLoading(true);
    const [sk, my, dir, tm, myTm] = await Promise.all([
      get('/api/skills'), get('/api/skills/my'), get('/api/skills/directory'),
      get('/api/teams'), get('/api/teams/my')
    ]);
    setAllSkills(Array.isArray(sk)?sk:[]);
    setMySkills(Array.isArray(my)?my:[]);
    setDirectory(Array.isArray(dir)?dir:[]);
    setTeams(Array.isArray(tm)?tm:[]);
    setMyTeams(Array.isArray(myTm)?myTm:[]);
    setLoading(false);
  };

  const loadMatches = async () => {
    const m = await get('/api/skills/matches');
    setMatches(Array.isArray(m)?m:[]);
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (tab==='Matches') loadMatches(); }, [tab]);

  const handleAddSkill = async () => {
    if (!addSkill) return flash('Please select a skill');
    const res = await post('/api/skills/my', {skill_id:parseInt(addSkill), skill_type:addType, proficiency:addProf});
    if (res.error) return flash(res.error);
    flash(`✅ Skill added!`);
    setAddSkill('');
    const my = await get('/api/skills/my');
    setMySkills(Array.isArray(my)?my:[]);
  };

  const handleRemove = async (id) => {
    await del(`/api/skills/my/${id}`);
    setMySkills(prev => prev.filter(s=>s.id!==id));
  };

  const handleCreateTeam = async () => {
    if (!teamForm.title || !teamForm.event_name) return flash('Title and event name required');
    const res = await post('/api/teams', teamForm);
    if (res.error) return flash(res.error);
    flash('✅ Team post created!');
    setShowTeamForm(false);
    setTeamForm({title:'',event_name:'',event_date:'',description:'',required_skills:'',team_size:4});
    loadAll();
  };

  const handleApply = async (postId) => {
    const message = applyMsg[postId] || '';
    const res = await post(`/api/teams/${postId}/apply`, {message});
    flash(res.error ? res.error : '✅ Application sent!');
    setApplyMsg(prev=>({...prev,[postId]:''}));
    loadAll();
  };

  const handleRespond = async (appId, status) => {
    await post(`/api/teams/applications/${appId}`, {status});
    flash(`✅ Application ${status}`);
    const myTm = await get('/api/teams/my');
    setMyTeams(Array.isArray(myTm)?myTm:[]);
  };

  const myTeachIds = mySkills.filter(s=>s.skill_type==='teach').map(s=>s.skill_id);
  const myLearnIds = mySkills.filter(s=>s.skill_type==='learn').map(s=>s.skill_id);

  const filteredSkills = allSkills.filter(s =>
    (catFilter==='All' || s.category===catFilter) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredDir = directory.filter(u =>
    !dirSearch || u.name.toLowerCase().includes(dirSearch.toLowerCase()) ||
    u.skills.some(s=>s.skill.toLowerCase().includes(dirSearch.toLowerCase()))
  );

  const cats = ['All',...Object.keys(CAT_ICONS)];

  return (
    <div className="ss-page">
      <div className="ss-header">
        <div>
          <h2 className="ss-title">🤝 Skill Sharing Matrix</h2>
          <p className="ss-sub">Learn from peers · Teach what you know · Build teams</p>
        </div>
        <div className="ss-stats">
          <div className="ss-stat"><span>{allSkills.length}</span><p>Skills</p></div>
          <div className="ss-stat"><span>{directory.length}</span><p>Teachers</p></div>
          <div className="ss-stat"><span>{teams.length}</span><p>Open Teams</p></div>
        </div>
      </div>

      {msg && <div className="ss-flash">{msg}</div>}

      {/* TABS */}
      <div className="ss-tabs">
        {TABS.map(t => <button key={t} className={`ss-tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {/* ── MY SKILLS ─────────────────────────────────── */}
      {tab==='My Skills' && (
        <div>
          {/* Add skill form */}
          <div className="ss-add-card">
            <h3>➕ Add a Skill</h3>
            <div className="ss-add-row">
              <div className="ss-add-type">
                <button className={`ss-type-btn ${addType==='teach'?'active-teach':''}`} onClick={()=>setAddType('teach')}>📢 I Can Teach</button>
                <button className={`ss-type-btn ${addType==='learn'?'active-learn':''}`} onClick={()=>setAddType('learn')}>📖 I Want to Learn</button>
              </div>
              <select className="ss-select" value={addSkill} onChange={e=>setAddSkill(e.target.value)}>
                <option value="">Select a skill...</option>
                {cats.filter(c=>c!=='All').map(cat => (
                  <optgroup key={cat} label={`${CAT_ICONS[cat]} ${cat}`}>
                    {allSkills.filter(s=>s.category===cat).map(s =>
                      <option key={s.id} value={s.id}>{s.name}</option>
                    )}
                  </optgroup>
                ))}
              </select>
              {addType==='teach' && (
                <select className="ss-select ss-select-sm" value={addProf} onChange={e=>setAddProf(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              )}
              <button className="ss-btn-add" onClick={handleAddSkill}>Add</button>
            </div>
          </div>

          {/* Teach / Learn split */}
          <div className="ss-skill-split">
            <div className="ss-skill-col">
              <h4 className="ss-col-title ss-col-teach">📢 Skills I Can Teach ({mySkills.filter(s=>s.skill_type==='teach').length})</h4>
              {mySkills.filter(s=>s.skill_type==='teach').length === 0
                ? <p className="ss-empty-col">Add skills you can teach others</p>
                : mySkills.filter(s=>s.skill_type==='teach').map(s => (
                  <div key={s.id} className="ss-skill-chip ss-chip-teach">
                    <span>{CAT_ICONS[s.category]} {s.skill_name}</span>
                    <span className="ss-prof" style={{color:PROF_CONFIG[s.proficiency]?.color}}>{PROF_CONFIG[s.proficiency]?.label}</span>
                    <button className="ss-chip-del" onClick={()=>handleRemove(s.id)}>✕</button>
                  </div>
                ))}
            </div>
            <div className="ss-skill-col">
              <h4 className="ss-col-title ss-col-learn">📖 Skills I Want to Learn ({mySkills.filter(s=>s.skill_type==='learn').length})</h4>
              {mySkills.filter(s=>s.skill_type==='learn').length === 0
                ? <p className="ss-empty-col">Add skills you want to learn</p>
                : mySkills.filter(s=>s.skill_type==='learn').map(s => (
                  <div key={s.id} className="ss-skill-chip ss-chip-learn">
                    <span>{CAT_ICONS[s.category]} {s.skill_name}</span>
                    <button className="ss-chip-del" onClick={()=>handleRemove(s.id)}>✕</button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MATCHES ───────────────────────────────────── */}
      {tab==='Matches' && (
        <div>
          <p className="ss-matches-hint">These students can teach skills you want to learn:</p>
          {myLearnIds.length===0 ? (
            <div className="ss-empty">Add skills you want to learn in "My Skills" to find matches.</div>
          ) : matches.length===0 ? (
            <div className="ss-empty">No matches found yet. More students are joining!</div>
          ) : (
            <div className="ss-match-grid">
              {matches.map(m => (
                <div key={m.user_id} className="ss-match-card">
                  <div className="ss-match-avatar">{m.name.charAt(0).toUpperCase()}</div>
                  <div className="ss-match-info">
                    <p className="ss-match-name">{m.name}</p>
                    <p className="ss-match-email">{m.email}</p>
                    <div className="ss-match-skills">
                      {m.skills.map((s,i) => (
                        <span key={i} className="ss-match-skill">
                          {CAT_ICONS[s.category]} {s.skill}
                          <span style={{color:PROF_CONFIG[s.proficiency]?.color,marginLeft:'4px',fontSize:'10px'}}>
                            {PROF_CONFIG[s.proficiency]?.label}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DIRECTORY ─────────────────────────────────── */}
      {tab==='Directory' && (
        <div>
          <div className="ss-dir-toolbar">
            <input className="ss-search" placeholder="🔎 Search by name or skill..." value={dirSearch} onChange={e=>setDirSearch(e.target.value)} />
            <div className="ss-cat-chips">
              {cats.map(c => (
                <button key={c} className={`ss-cat-chip ${catFilter===c?'active':''}`} onClick={()=>setCatFilter(c)}>
                  {c!=='All' && CAT_ICONS[c]} {c}
                </button>
              ))}
            </div>
          </div>
          {filteredDir.length===0
            ? <div className="ss-empty">No teachers found.</div>
            : <div className="ss-dir-grid">
                {filteredDir.map(u => (
                  <div key={u.user_id} className="ss-dir-card">
                    <div className="ss-dir-top">
                      <div className="ss-dir-avatar">{u.name.charAt(0)}</div>
                      <div>
                        <p className="ss-dir-name">{u.name}</p>
                        <p className="ss-dir-email">{u.email}</p>
                      </div>
                    </div>
                    <div className="ss-dir-skills">
                      {u.skills.filter(s=>catFilter==='All'||s.category===catFilter).map((s,i)=>(
                        <span key={i} className="ss-dir-skill">{CAT_ICONS[s.category]} {s.skill}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* ── TEAM UP ───────────────────────────────────── */}
      {tab==='🏆 Team Up' && (
        <div>
          <div className="ss-team-header">
            <div>
              <p className="ss-matches-hint">Find teammates for hackathons and coding events</p>
            </div>
            <button className="ss-btn-create-team" onClick={()=>setShowTeamForm(f=>!f)}>
              {showTeamForm ? '✕ Cancel' : '➕ Post Team Request'}
            </button>
          </div>

          {/* Create team form */}
          {showTeamForm && (
            <div className="ss-team-form">
              <h3>🏆 Create Team Post</h3>
              <div className="ss-team-grid">
                {[['Event Title *','title','e.g. Smart India Hackathon 2026'],
                  ['Event Name *','event_name','e.g. SIH, HackFest, Codeforces'],
                  ['Event Date','event_date','e.g. 15 Aug 2026'],
                  ['Max Team Size','team_size','4']].map(([label,key,ph]) => (
                  <div key={key} className="ss-form-group">
                    <label>{label}</label>
                    <input placeholder={ph} value={teamForm[key]} type={key==='team_size'?'number':'text'}
                      onChange={e=>setTeamForm(f=>({...f,[key]:e.target.value}))} />
                  </div>
                ))}
                <div className="ss-form-group ss-span2">
                  <label>Required Skills (comma separated)</label>
                  <input placeholder="e.g. Python, React, ML, UI Design" value={teamForm.required_skills}
                    onChange={e=>setTeamForm(f=>({...f,required_skills:e.target.value}))} />
                </div>
                <div className="ss-form-group ss-span2">
                  <label>Description</label>
                  <textarea rows={3} placeholder="Describe your project idea and what kind of teammates you're looking for..."
                    value={teamForm.description} onChange={e=>setTeamForm(f=>({...f,description:e.target.value}))} />
                </div>
              </div>
              <button className="ss-btn-submit-team" onClick={handleCreateTeam}>🚀 Post Team Request</button>
            </div>
          )}

          {/* My team posts */}
          {myTeams.length > 0 && (
            <div className="ss-my-teams">
              <h3>📋 My Team Posts</h3>
              {myTeams.map(post => (
                <div key={post.id} className="ss-team-card ss-my-post">
                  <p className="ss-team-title">{post.title} — <span>{post.event_name}</span></p>
                  {post.applicants.length===0
                    ? <p className="ss-no-apps">No applications yet</p>
                    : post.applicants.map(app=>(
                      <div key={app.id} className="ss-applicant">
                        <div>
                          <span className="ss-app-name">{app.name}</span>
                          <span className="ss-app-email">{app.email}</span>
                          {app.message && <span className="ss-app-msg">"{app.message}"</span>}
                        </div>
                        {app.status==='pending' ? (
                          <div className="ss-app-actions">
                            <button className="ss-btn-accept" onClick={()=>handleRespond(app.id,'accepted')}>✅ Accept</button>
                            <button className="ss-btn-reject" onClick={()=>handleRespond(app.id,'rejected')}>❌ Reject</button>
                          </div>
                        ) : (
                          <span className={`ss-app-status ${app.status}`}>{app.status==='accepted'?'✅ Accepted':'❌ Rejected'}</span>
                        )}
                      </div>
                    ))
                  }
                </div>
              ))}
            </div>
          )}

          {/* Open teams */}
          <h3 style={{margin:'20px 0 14px',color:'var(--text-primary)'}}>🔓 Open Team Requests</h3>
          {teams.length===0
            ? <div className="ss-empty">No open team requests yet. Be the first to post!</div>
            : <div className="ss-teams-grid">
                {teams.map(t => (
                  <div key={t.id} className="ss-team-card">
                    <div className="ss-team-top">
                      <div>
                        <p className="ss-team-title">{t.title}</p>
                        <p className="ss-team-event">🏆 {t.event_name} {t.event_date && `· 📅 ${t.event_date}`}</p>
                      </div>
                      <span className="ss-team-size">👥 {t.team_size} max</span>
                    </div>
                    {t.description && <p className="ss-team-desc">{t.description}</p>}
                    {t.required_skills && (
                      <div className="ss-team-req-skills">
                        {t.required_skills.split(',').map((s,i)=>(
                          <span key={i} className="ss-req-chip">{s.trim()}</span>
                        ))}
                      </div>
                    )}
                    <div className="ss-team-footer">
                      <span className="ss-team-poster">👤 {t.poster} · {t.applicant_count} applied · {t.created_at}</span>
                      {t.posted_by !== userId && (
                        <div className="ss-apply-row">
                          <input className="ss-apply-input" placeholder="Short intro (optional)"
                            value={applyMsg[t.id]||''} onChange={e=>setApplyMsg(p=>({...p,[t.id]:e.target.value}))} />
                          <button className="ss-btn-apply" onClick={()=>handleApply(t.id)}>🙋 Apply</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}
    </div>
  );
}
