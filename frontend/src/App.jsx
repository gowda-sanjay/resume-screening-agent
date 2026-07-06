import React, { useState, useEffect, useRef } from 'react'
import './App.css'

const API_BASE_URL = 'http://127.0.0.1:8000'

/* ─────── tiny helpers ─────── */
const fitColor = {
  'Strong Fit': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', bar: 'from-emerald-400 to-teal-400' },
  'Moderate Fit': { bg: 'bg-amber-500/15', text: 'text-amber-400', bar: 'from-amber-400 to-orange-400' },
  'No Fit': { bg: 'bg-rose-500/15', text: 'text-rose-400', bar: 'from-rose-400 to-pink-400' },
}

function ScoreRing({ score, size = 96 }) {
  const r = 44, c = 2 * Math.PI * r
  const offset = c - (c * score) / 100
  const col = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  )
}

function AnimatedBar({ value, colorClass, delay = 0 }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return (
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
        style={{ width: `${width}%`, transition: 'width 1.1s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </div>
  )
}

function DropZone({ id, icon, accept, multiple, active, onDragEnter, onDragOver, onDragLeave, onDrop, onChange, onClick, children }) {
  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300
        ${active
          ? 'border-violet-400 bg-violet-500/10 dropzone-active scale-[1.02]'
          : 'border-white/15 hover:border-violet-400/50 hover:bg-white/5'}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
    >
      <input id={id} type="file" className="hidden" accept={accept} multiple={multiple} onChange={onChange} />
      <div className={`mx-auto w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3 transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
        {icon}
      </div>
      {children}
    </div>
  )
}

export default function App() {
  /* state */
  const [dark] = useState(true)
  const [jdFile, setJdFile] = useState(null)
  const [resumeFiles, setResumeFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [jdInfo, setJdInfo] = useState(null)
  const [resumesUploaded, setResumesUploaded] = useState([])
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [fitFilter, setFitFilter] = useState('All')
  const [jdDrag, setJdDrag] = useState(false)
  const [rDrag, setRDrag] = useState(false)
  const [step, setStep] = useState(1)   // 1=upload, 2=results
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  /* drag helpers */
  const mkDrag = (setter) => ({
    onDragEnter: (e) => { e.preventDefault(); setter(true) },
    onDragOver: (e) => { e.preventDefault(); setter(true) },
    onDragLeave: (e) => { e.preventDefault(); setter(false) },
  })

  /* JD upload */
  const uploadJD = async () => {
    if (!jdFile) return
    setLoading(true); setStatusMsg('Reading job description…')
    const form = new FormData(); form.append('file', jdFile)
    try {
      const r = await fetch(`${API_BASE_URL}/upload-jd`, { method: 'POST', body: form })
      if (!r.ok) throw new Error(await r.text())
      setJdInfo(await r.json()); setStatusMsg('Job description loaded ✓')
    } catch (e) { alert(e.message); setStatusMsg('Upload failed.') }
    setLoading(false)
  }

  const uploadResumes = async () => {
    if (!resumeFiles.length) return
    setLoading(true); setStatusMsg('Uploading resumes…')
    const form = new FormData()
    resumeFiles.forEach(f => form.append('files', f))
    try {
      const r = await fetch(`${API_BASE_URL}/upload-resumes`, { method: 'POST', body: form })
      if (!r.ok) throw new Error(await r.text())
      const d = await r.json()
      setResumesUploaded(d.files); setStatusMsg(`${d.files.length} resumes registered ✓`)
    } catch (e) { alert(e.message); setStatusMsg('Upload failed.') }
    setLoading(false)
  }

  const analyze = async () => {
    setLoading(true); setStatusMsg('Running AI semantic screening…')
    try {
      const r = await fetch(`${API_BASE_URL}/analyze`, { method: 'POST' })
      if (!r.ok) throw new Error(await r.text())
      const d = await r.json()
      setResults(d); setSelected(d[0] ?? null)
      setStep(2); setStatusMsg('Analysis complete ✓')
    } catch (e) { alert(e.message); setStatusMsg('Analysis failed.') }
    setLoading(false)
  }

  const filtered = results.filter(c =>
    (c.candidate.name.toLowerCase().includes(search.toLowerCase()) ||
      c.filename.toLowerCase().includes(search.toLowerCase()) ||
      c.candidate.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))) &&
    c.score >= minScore &&
    (fitFilter === 'All' || c.recommendation === fitFilter)
  )

  const top = results[0] ?? null

  return (
    <div className={`min-h-screen bg-[#09090f] text-slate-100 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>

      {/* ── Ambient background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px] animate-blob" />
        <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/12 blur-[100px] animate-blob delay-300" />
        <div className="absolute bottom-[-15%] left-[30%] w-[450px] h-[450px] rounded-full bg-cyan-600/10 blur-[120px] animate-blob delay-600" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-20 border-b border-white/8 glass-card rounded-none sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 animate-fade-in-down">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg glow-indigo animate-float">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient leading-none">Rooman AI Screener</h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">24-Hour AI Agent Challenge</p>
            </div>
          </div>

          <div className="flex items-center gap-3 animate-fade-in-down delay-200">
            {/* Step pills */}
            {[1, 2].map(s => (
              <button
                key={s}
                onClick={() => s <= (jdInfo ? 2 : 1) && setStep(s)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300
                  ${step === s
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 glow-indigo'
                    : 'text-slate-500 hover:text-slate-300'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                  ${step === s ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                  {s}
                </span>
                {s === 1 ? 'Upload' : 'Results'}
              </button>
            ))}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Live
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* ═══════════════════════════════
            STEP 1 — UPLOAD
        ═══════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in-up">

            {/* Hero */}
            <div className="text-center space-y-3 py-6">
              <h2 className="text-4xl font-extrabold text-gradient">AI-Powered Resume Screening</h2>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                Upload a job description and candidate resumes. Our AI ranks them using semantic similarity + weighted scoring.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* ── Card: JD ── */}
              <div className="glass-card p-6 space-y-5 animate-fade-in-up delay-100 hover:border-violet-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Job Description</h3>
                    <p className="text-xs text-slate-500">Step 1 of 3</p>
                  </div>
                  {jdInfo && (
                    <span className="ml-auto text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                      ✓ Loaded
                    </span>
                  )}
                </div>

                {!jdInfo ? (
                  <>
                    <DropZone
                      id="jd-inp" accept=".txt,.pdf" multiple={false}
                      active={jdDrag}
                      {...mkDrag(setJdDrag)}
                      onDrop={(e) => { e.preventDefault(); setJdDrag(false); e.dataTransfer.files[0] && setJdFile(e.dataTransfer.files[0]) }}
                      onClick={() => document.getElementById('jd-inp').click()}
                      onChange={e => e.target.files[0] && setJdFile(e.target.files[0])}
                      icon={<svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                    >
                      <p className="text-sm font-semibold text-slate-300">
                        {jdFile ? jdFile.name : 'Drag & Drop or Click'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Accepts PDF or TXT</p>
                    </DropZone>

                    {jdFile && (
                      <button
                        onClick={uploadJD} disabled={loading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-bold shadow-lg shadow-violet-500/20 active:scale-95 transition-all duration-200 disabled:opacity-40"
                      >
                        {loading ? 'Processing…' : 'Ingest Job Description'}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="space-y-3 animate-scale-in">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-violet-300">{jdInfo.title}</h4>
                      <button onClick={() => { setJdInfo(null); setJdFile(null) }} className="text-[10px] text-rose-400 hover:underline">Clear</button>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Detected Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {jdInfo.requirements.length > 0 ? jdInfo.requirements.map((r, i) => (
                          <span key={i} className="skill-tag text-[10px] px-2.5 py-1 bg-violet-500/15 text-violet-300 border border-violet-500/20 rounded-full font-semibold">
                            {r}
                          </span>
                        )) : <span className="text-xs text-slate-500 italic">No skills detected.</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Card: Resumes ── */}
              <div className="glass-card p-6 space-y-5 animate-fade-in-up delay-200 hover:border-violet-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Candidate Resumes</h3>
                    <p className="text-xs text-slate-500">Step 2 of 3</p>
                  </div>
                  {resumesUploaded.length > 0 && (
                    <span className="ml-auto text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">
                      ✓ {resumesUploaded.length} Registered
                    </span>
                  )}
                </div>

                <DropZone
                  id="res-inp" accept=".pdf,.docx,.txt" multiple
                  active={rDrag}
                  {...mkDrag(setRDrag)}
                  onDrop={(e) => { e.preventDefault(); setRDrag(false); e.dataTransfer.files.length && setResumeFiles(p => [...p, ...Array.from(e.dataTransfer.files)]) }}
                  onClick={() => document.getElementById('res-inp').click()}
                  onChange={e => e.target.files.length && setResumeFiles(p => [...p, ...Array.from(e.target.files)])}
                  icon={<svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                >
                  <p className="text-sm font-semibold text-slate-300">Drag & Drop Multiple Resumes</p>
                  <p className="text-xs text-slate-500 mt-1">PDF · DOCX · TXT</p>
                </DropZone>

                {resumeFiles.length > 0 && (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {resumeFiles.map((f, i) => {
                      const uploaded = resumesUploaded.includes(f.name)
                      return (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/4 border border-white/6 text-xs animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${uploaded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'}`}>
                              {uploaded ? '✓' : '·'}
                            </span>
                            <span className="font-medium truncate">{f.name}</span>
                            <span className="text-slate-500 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                          </div>
                          {!uploaded && (
                            <button onClick={() => setResumeFiles(p => p.filter((_, x) => x !== i))} className="text-rose-400 shrink-0 ml-2 hover:scale-110 transition-transform">✕</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {resumeFiles.length > 0 && resumesUploaded.length < resumeFiles.length && (
                  <button
                    onClick={uploadResumes} disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-sm font-bold shadow-lg shadow-cyan-500/15 active:scale-95 transition-all duration-200 disabled:opacity-40"
                  >
                    {loading ? 'Uploading…' : 'Register Candidates'}
                  </button>
                )}
              </div>
            </div>

            {/* ── Analyze trigger ── */}
            <div className="glass-card p-5 flex flex-col sm:flex-row items-center justify-between gap-5 animate-fade-in-up delay-300">
              <div className="flex items-center gap-3">
                {loading ? (
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-violet-400 animate-spin-slow" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-violet-400" />
                  </div>
                )}
                <p className="text-sm text-slate-400 font-medium">
                  {statusMsg || 'Upload a JD and resumes, then run analysis.'}
                </p>
              </div>

              <button
                onClick={analyze}
                disabled={loading || !jdInfo || resumesUploaded.length === 0}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600
                  hover:from-violet-500 hover:via-indigo-500 hover:to-blue-500
                  text-sm font-bold shadow-xl shadow-indigo-500/20 glow-indigo
                  active:scale-95 transition-all duration-300
                  disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed"
              >
                🚀 Run AI Screening Analysis
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════
            STEP 2 — RESULTS
        ═══════════════════════════════ */}
        {step === 2 && results.length > 0 && (
          <div className="space-y-8 animate-fade-in-up">

            {/* ── Summary stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Candidates', value: results.length, icon: '👥', col: 'from-violet-500 to-indigo-500' },
                { label: 'Strong Fit', value: results.filter(r => r.recommendation === 'Strong Fit').length, icon: '🏆', col: 'from-emerald-500 to-teal-500' },
                { label: 'Moderate Fit', value: results.filter(r => r.recommendation === 'Moderate Fit').length, icon: '📊', col: 'from-amber-500 to-orange-500' },
                { label: 'Top Score', value: `${top?.score ?? 0}%`, icon: '⚡', col: 'from-cyan-500 to-blue-500' },
              ].map((stat, i) => (
                <div key={i} className={`glass-card p-4 space-y-2 animate-fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{stat.icon}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${stat.col} bg-opacity-15`}></span>
                  </div>
                  <p className={`text-2xl font-extrabold text-gradient`}>{stat.value}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* ── Top Candidate Spotlight ── */}
            {top && (
              <div className="relative rounded-3xl overflow-hidden animate-scale-in">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-indigo-900/70 to-slate-900/90" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl -ml-10 -mb-10" />
                <div className="relative z-10 p-7 border border-white/10 rounded-3xl">
                  <div className="flex flex-col lg:flex-row gap-7">

                    {/* Bio */}
                    <div className="flex-1 space-y-5">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold">
                        ⭐ Top Ranked Candidate
                      </div>
                      <div>
                        <h2 className="text-3xl font-extrabold tracking-tight">{top.candidate.name}</h2>
                        <p className="text-slate-400 text-sm mt-1">{top.filename}</p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {top.candidate.email && (
                          <a href={`mailto:${top.candidate.email}`} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 border border-white/8 text-xs font-medium hover:bg-white/12 transition-colors">
                            <span className="text-violet-400">✉</span> {top.candidate.email}
                          </a>
                        )}
                        {top.candidate.phone && (
                          <span className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 border border-white/8 text-xs font-medium">
                            <span className="text-cyan-400">📞</span> {top.candidate.phone}
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">AI Fit Explanation</p>
                        <p className="text-sm text-slate-200 leading-relaxed">{top.fit_summary}</p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Matched Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {top.matched_skills.map((s, i) => (
                            <span key={i} className="skill-tag text-[10px] px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold">✓ {s}</span>
                          ))}
                          {top.missing_skills.map((s, i) => (
                            <span key={i} className="skill-tag text-[10px] px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-semibold">✕ {s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Score ring */}
                    <div className="flex flex-col items-center justify-center glass rounded-2xl p-6 border border-white/8 w-full lg:w-52 space-y-3">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Overall Score</p>
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <ScoreRing score={top.score} size={112} />
                        <div className="absolute text-center">
                          <div className="text-3xl font-extrabold">{top.score}%</div>
                          <div className="text-[9px] text-slate-400 uppercase font-bold">{top.recommendation}</div>
                        </div>
                      </div>
                      <div className="w-full space-y-2 text-xs">
                        {[
                          { label: 'Skills (50%)', v: top.score_details.skill_match_score },
                          { label: 'Experience', v: top.score_details.experience_score },
                          { label: 'Education', v: top.score_details.education_score },
                          { label: 'Projects', v: top.score_details.projects_score },
                          { label: 'Certs', v: top.score_details.certifications_score },
                        ].map((item, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>{item.label}</span><span className="font-bold text-white">{item.v}%</span>
                            </div>
                            <AnimatedBar value={item.v} colorClass="from-violet-500 to-indigo-400" delay={i * 120 + 400} />
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] px-3 py-1.5 rounded-full bg-white/8 border border-white/8 text-slate-300 font-medium text-center">
                        Semantic: {top.score_details.semantic_similarity}%
                      </span>
                    </div>
                  </div>

                  {/* Interview Questions */}
                  {top.interview_questions?.length > 0 && (
                    <div className="mt-6 border-t border-white/8 pt-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-base">💬</span>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">AI-Generated Interview Questions</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {top.interview_questions.map((q, i) => (
                          <div key={i} className="glass rounded-xl p-4 border border-white/6 hover:border-violet-500/30 transition-colors animate-fade-in-up" style={{ animationDelay: `${300 + i * 80}ms` }}>
                            <p className="text-[9px] text-violet-400 font-bold uppercase mb-1">Q{i + 1}</p>
                            <p className="text-xs text-slate-200 leading-relaxed">"{q}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Candidate Table ── */}
            <div className="glass-card overflow-hidden animate-fade-in-up delay-200">

              {/* Table toolbar */}
              <div className="p-5 border-b border-white/8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white/2">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold">All Candidates</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded-full">
                    {filtered.length} shown
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search name or skill…"
                      className="bg-white/6 border border-white/10 text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-violet-500 w-48 placeholder:text-slate-500"
                    />
                  </div>

                  {/* Fit filter */}
                  <select
                    value={fitFilter} onChange={e => setFitFilter(e.target.value)}
                    className="bg-white/6 border border-white/10 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-violet-500"
                  >
                    {['All', 'Strong Fit', 'Moderate Fit', 'No Fit'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>

                  {/* Score slider */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Min:</span>
                    <input type="range" min="0" max="100" value={minScore} onChange={e => setMinScore(+e.target.value)} className="w-20 accent-violet-500" />
                    <span className="font-bold text-violet-400 w-6">{minScore}%</span>
                  </div>

                  {/* Downloads */}
                  <div className="flex gap-2 border-l border-white/8 pl-3">
                    {['csv', 'json'].map(fmt => (
                      <button key={fmt}
                        onClick={() => window.open(`${API_BASE_URL}/download/${fmt}`, '_blank')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/6 border border-white/10 hover:bg-white/10 text-xs font-semibold uppercase transition-all active:scale-95"
                      >
                        ⬇ {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/3 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      {['Rank', 'Name', 'Score', 'Fit', 'Skills', 'Why'].map(h => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((res, idx) => {
                      const fit = fitColor[res.recommendation] ?? fitColor['No Fit']
                      const isSelected = selected?.candidate?.name === res.candidate?.name
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelected(res)}
                          className={`table-row-hover cursor-pointer transition-all duration-200 animate-fade-in-up ${isSelected ? 'bg-violet-500/8 border-l-2 border-l-violet-500' : 'hover:bg-white/3'}`}
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          {/* Rank */}
                          <td className="px-5 py-4">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold
                              ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-400 text-slate-900'
                                : idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900'
                                  : 'bg-white/8 text-slate-400'}`}>
                              {idx + 1}
                            </div>
                          </td>

                          {/* Name */}
                          <td className="px-5 py-4">
                            <p className="font-bold text-sm">{res.candidate.name}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{res.filename}</p>
                          </td>

                          {/* Score */}
                          <td className="px-5 py-4">
                            <div className="space-y-1.5">
                              <span className="text-lg font-extrabold">{res.score}%</span>
                              <div className="w-24 h-1 rounded-full bg-white/8 overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${fit.bar}`} style={{ width: `${res.score}%`, transition: 'width 1s ease' }} />
                              </div>
                            </div>
                          </td>

                          {/* Fit badge */}
                          <td className="px-5 py-4">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${fit.bg} ${fit.text} border-current/20`}>
                              {res.recommendation}
                            </span>
                          </td>

                          {/* Skills */}
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {res.candidate.skills.slice(0, 3).map((s, i) => (
                                <span key={i} className="text-[9px] px-2 py-0.5 bg-white/6 border border-white/8 rounded-full font-medium text-slate-300">{s}</span>
                              ))}
                              {res.candidate.skills.length > 3 && (
                                <span className="text-[9px] px-2 py-0.5 text-slate-500 font-bold">+{res.candidate.skills.length - 3}</span>
                              )}
                            </div>
                          </td>

                          {/* Why */}
                          <td className="px-5 py-4 pr-6">
                            <p className="text-[11px] text-slate-400 line-clamp-2 max-w-[260px]">{res.fit_summary}</p>
                          </td>
                        </tr>
                      )
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan="6" className="text-center py-10 text-slate-500 italic">No candidates match the active filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Candidate Detail Side Panel ── */}
            {selected && (
              <div className="glass-card p-6 space-y-5 animate-scale-in">
                <h3 className="font-bold text-base border-b border-white/8 pb-3">
                  Profile: <span className="text-gradient">{selected.candidate.name}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Experience', items: selected.candidate.experience, icon: '💼', color: 'violet' },
                    { label: 'Education', items: selected.candidate.education, icon: '🎓', color: 'cyan' },
                    { label: 'Projects', items: selected.candidate.projects, icon: '🛠️', color: 'amber' },
                    { label: 'Certifications', items: selected.candidate.certifications, icon: '📜', color: 'emerald' },
                  ].map((sec, i) => (
                    <div key={i} className="glass rounded-2xl p-4 space-y-3 border border-white/6 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="flex items-center gap-2">
                        <span>{sec.icon}</span>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{sec.label}</h4>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1.5">
                        {sec.items.length > 0 ? sec.items.map((item, j) => (
                          <p key={j} className="text-[11px] text-slate-300 leading-snug">• {item}</p>
                        )) : <p className="text-[11px] text-slate-500 italic">Not detected.</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score breakdown bars */}
                <div className="glass rounded-2xl p-5 border border-white/6 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Score Breakdown</h4>
                  {[
                    { label: 'Skill Match (50%)', v: selected.score_details.skill_match_score, color: 'from-violet-500 to-indigo-500' },
                    { label: 'Experience (20%)', v: selected.score_details.experience_score, color: 'from-cyan-500 to-blue-500' },
                    { label: 'Education (10%)', v: selected.score_details.education_score, color: 'from-emerald-500 to-teal-500' },
                    { label: 'Projects (10%)', v: selected.score_details.projects_score, color: 'from-amber-500 to-orange-500' },
                    { label: 'Certifications (10%)', v: selected.score_details.certifications_score, color: 'from-pink-500 to-rose-500' },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1.5 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="text-white font-bold">{item.v}%</span>
                      </div>
                      <AnimatedBar value={item.v} colorClass={item.color} delay={i * 100 + 200} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-white/8">
                    <span className="text-xs text-slate-400 font-bold">COMBINED SCORE</span>
                    <span className="text-2xl font-extrabold text-gradient">{selected.score}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/8 py-6 text-center mt-10">
        <p className="text-[11px] text-slate-500 font-medium">
          © 2026 Rooman Technologies · AI Agent Resume Screening Challenge · Built with React + FastAPI
        </p>
      </footer>
    </div>
  )
}
