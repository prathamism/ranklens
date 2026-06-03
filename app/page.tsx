'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ArrowRight, Zap, Globe, Bot, Shield, ChevronDown, X, Plus, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import dynamic from 'next/dynamic'
import type { AuditResult, CompareResult, BulkResult, AuditMode, AuditDepth } from '@/lib/types'

const ProgressView = dynamic(() => import('@/components/ProgressView'), { ssr: false })
const ReportView = dynamic(() => import('@/components/report/ReportView'), { ssr: false })

type AppView = 'home' | 'progress' | 'report'

export default function HomePage() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [view, setView] = useState<AppView>('home')
  const [mode, setMode] = useState<AuditMode>('audit')
  const [depth] = useState<AuditDepth>('deep')
  const [url, setUrl] = useState('')
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [bulkUrls, setBulkUrls] = useState<string[]>(['', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [result, setResult] = useState<AuditResult | undefined>()
  const [compareResult, setCompareResult] = useState<CompareResult | undefined>()
  const [bulkResults, setBulkResults] = useState<BulkResult[] | undefined>()

  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'report' || view === 'progress') {
          handleBack()
        } else {
          setUrl('')
          setCompetitorUrl('')
          setBulkUrls(['', ''])
          setError('')
          inputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [view])

  const validate = () => {
    if (mode === 'audit') {
      if (!url.trim()) return 'Please enter a URL to audit'
      try { new URL(url.startsWith('http') ? url : `https://${url}`) } catch { return 'Please enter a valid URL' }
    }
    if (mode === 'compare') {
      if (!url.trim() || !competitorUrl.trim()) return 'Please enter both URLs to compare'
    }
    if (mode === 'bulk') {
      const filled = bulkUrls.filter(u => u.trim())
      if (filled.length < 1) return 'Please enter at least one URL'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError('')

    setView('progress')
    setLoading(true)

    try {
      const body = {
        url: url.startsWith('http') ? url : `https://${url}`,
        competitorUrl: competitorUrl ? (competitorUrl.startsWith('http') ? competitorUrl : `https://${competitorUrl}`) : undefined,
        urls: bulkUrls.filter(u => u.trim()).map(u => u.startsWith('http') ? u : `https://${u}`),
        mode,
        depth,
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 429) {
        const data = await res.json()
        throw new Error(data.error || 'Rate limit exceeded')
      }
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()

      if (data.mode === 'audit') setResult(data.result)
      if (data.mode === 'compare') setCompareResult(data.result)
      if (data.mode === 'bulk') setBulkResults(data.results)

      setView('report')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze. Please check the URL and try again.')
      setView('home')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setView('home')
    setResult(undefined)
    setCompareResult(undefined)
    setBulkResults(undefined)
  }

  const handleRerun = () => {
    setView('home')
  }

  if (view === 'progress') {
    return <ProgressView mode={mode} url={url || bulkUrls[0]} />
  }

  if (view === 'report') {
    return (
      <ReportView
        mode={mode}
        result={result}
        compareResult={compareResult}
        bulkResults={bulkResults}
        onBack={handleBack}
        onRerun={handleRerun}
      />
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Ambient blobs */}
      <div className="absolute pointer-events-none" style={{ top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(170,255,62,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '20%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />

      {/* ── NAV ── */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#AAFF3E" strokeWidth="1.5" strokeOpacity="0.6" />
            <circle cx="16" cy="16" r="7" stroke="#AAFF3E" strokeWidth="1.5" strokeOpacity="0.4" />
            <circle cx="16" cy="16" r="2.5" fill="#AAFF3E" />
          </svg>
          <span className="font-display text-xl tracking-widest" style={{ color: 'var(--color-heading)' }}>RANKLENS</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'var(--color-muted)' }}>
          <a href="#audit" className="hover:text-white transition-colors">Home</a>
          <a href="#features" className="hover:text-white transition-colors">Services</a>
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#trusted" className="hover:text-white transition-colors">What&apos;s new?</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-muted)' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => document.getElementById('audit')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-5 py-2.5 rounded-xl font-sans font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#AAFF3E', color: '#070A12', boxShadow: '0 0 24px rgba(170,255,62,0.35)' }}
          >
            Explore now
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <p className="text-xs font-mono font-semibold tracking-widest mb-5 uppercase" style={{ color: '#AAFF3E' }}>
              KEEP YOUR SITE RANKED !
            </p>
            <h1 className="font-display leading-[0.95] mb-6" style={{ fontSize: 'clamp(44px, 6vw, 80px)', color: 'var(--color-heading)' }}>
              Best <span style={{ color: '#AAFF3E' }}>SEO + GEO</span>
              <br />audit platform
              <br /><span style={{ color: 'var(--color-muted)' }}>for your site.</span>
            </h1>

            {/* Social proof */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex -space-x-2">
                {['#FF6B6B','#FFB740','#00D4FF','#AAFF3E','#C084FC'].map((c, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold" style={{ borderColor: 'var(--color-bg)', background: c, color: '#070A12', zIndex: 5 - i }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-display text-2xl tracking-wide" style={{ color: 'var(--color-heading)' }}>10K +</p>
                <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>Sites Audited</p>
              </div>
            </div>

            {/* Description + arrow */}
            <div className="flex items-start gap-4 mb-10">
              <div
                className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(170,255,62,0.12)', border: '1px solid rgba(170,255,62,0.3)' }}
              >
                <ArrowRight size={18} style={{ color: '#AAFF3E' }} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                RankLens audits your website&apos;s SEO health and AI-engine visibility in one scan — covering Google, ChatGPT, Perplexity, Gemini, and Bing Copilot.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => document.getElementById('audit')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-sans font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: '#AAFF3E', color: '#070A12', boxShadow: '0 0 30px rgba(170,255,62,0.3)' }}
              >
                Start Free Audit <ArrowRight size={16} />
              </button>
              <a href="#how" className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-sans font-semibold text-sm transition-all" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-body)' }}>
                How it works
              </a>
            </div>
          </div>

          {/* Right — visual score card */}
          <div className="relative flex items-center justify-center">
            {/* Decorative ring */}
            <div className="absolute w-80 h-80 rounded-full opacity-20" style={{ border: '1px solid #AAFF3E', background: 'radial-gradient(circle, rgba(170,255,62,0.08), transparent)' }} />
            <div className="absolute w-64 h-64 rounded-full opacity-10" style={{ border: '1px dashed #AAFF3E' }} />

            {/* Mock audit card */}
            <div className="relative z-10 w-72 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>Overall Score</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(170,255,62,0.1)', color: '#AAFF3E', border: '1px solid rgba(170,255,62,0.2)' }}>Grade A</span>
              </div>
              <div className="flex items-center gap-4 mb-5">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#AAFF3E" strokeWidth="6" strokeDasharray="201" strokeDashoffset="32" strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-display text-xl" style={{ color: '#AAFF3E' }}>84</span>
                </div>
                <div className="space-y-2 flex-1">
                  {[['SEO', 78, '#00D4FF'], ['GEO', 91, '#AAFF3E'], ['Content', 83, '#C084FC']].map(([label, val, color]) => (
                    <div key={label as string}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--color-muted)' }}>{label}</span>
                        <span style={{ color: 'var(--color-heading)' }}>{val}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: color as string }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(170,255,62,0.06)', border: '1px solid rgba(170,255,62,0.15)' }}>
                <Zap size={14} style={{ color: '#AAFF3E' }} />
                <span className="text-xs font-mono" style={{ color: 'var(--color-body)' }}>3 critical issues found</span>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-2 -left-4 px-4 py-2 rounded-xl text-xs font-mono" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
              ✓ AI-ready score
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED PARTNER ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display leading-tight mb-4" style={{ fontSize: 'clamp(32px, 4vw, 52px)', color: 'var(--color-heading)' }}>
              Your <span style={{ color: '#AAFF3E' }}>trusted</span> partner<br />for website visibility.
            </h2>
          </div>
          <div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-body)' }}>
              RankLens unifies SEO and Generative Engine Optimization into a single audit — so you rank on Google <em>and</em> get cited by AI platforms. No account needed, completely free.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              Powered by the PageSpeed API and AI analysis, RankLens delivers 30+ checks covering Core Web Vitals, schema markup, E-E-A-T signals, crawler access, and more.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS (01 / 02 / 03) ── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              num: '01.',
              title: 'Full SEO\nAudit.',
              desc: 'Meta tags, Core Web Vitals, schema markup, robots.txt, sitemap, internal links, and PageSpeed scores — all in one report.',
              highlight: false,
            },
            {
              num: '02.',
              title: 'GEO &\nbest practices.',
              desc: 'AI crawler access, llms.txt detection, E-E-A-T signals, Organization schema, and platform readiness for ChatGPT, Perplexity, Gemini, and Bing.',
              highlight: true,
            },
            {
              num: '03.',
              title: 'Competitor\nCompare.',
              desc: 'Head-to-head comparison of your site vs any competitor across every SEO and GEO metric.',
              highlight: false,
            },
          ].map((card) => (
            <div
              key={card.num}
              className="rounded-2xl p-7 flex flex-col justify-between transition-all"
              style={card.highlight
                ? { background: '#AAFF3E', color: '#070A12', minHeight: '280px' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '280px' }
              }
            >
              <div>
                <p className="font-display text-2xl mb-4 tracking-wide" style={{ color: card.highlight ? '#070A12' : '#AAFF3E' }}>{card.num}</p>
                <h3 className="font-display text-3xl leading-tight mb-4 whitespace-pre-line tracking-wide" style={{ color: card.highlight ? '#070A12' : 'var(--color-heading)' }}>
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: card.highlight ? 'rgba(7,10,18,0.7)' : 'var(--color-body)' }}>
                  {card.desc}
                </p>
              </div>
              {card.highlight && (
                <div className="flex items-center gap-2 mt-6 font-sans font-semibold text-sm" style={{ color: '#070A12' }}>
                  Learn More <ArrowRight size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── AUDIT FORM ── */}
      <section id="audit" className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left copy */}
          <div className="pt-4">
            <p className="text-xs font-mono font-semibold tracking-widest mb-4 uppercase" style={{ color: '#AAFF3E' }}>Free · No account needed</p>
            <h2 className="font-display leading-tight mb-4" style={{ fontSize: 'clamp(32px, 4vw, 52px)', color: 'var(--color-heading)' }}>
              Trusted platform<br /><span style={{ color: 'var(--color-muted)' }}>anytime &amp; anywhere.</span>
            </h2>
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#AAFF3E' }}>★</span>)}
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-body)' }}>
              This is a fast, accurate SEO + GEO audit that checks a <strong style={{ color: 'var(--color-heading)' }}>growing set of signals</strong> — meta tags, Core Web Vitals, AI crawler access, E-E-A-T, schema markup, and more.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
              RankLens <strong style={{ color: 'var(--color-heading)' }}>unites SEO and AI visibility</strong> into one score — so you can optimize for Google and get cited by AI platforms at the same time.
            </p>
          </div>

          {/* Right form */}
          <div className="rounded-2xl p-7" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Mode tabs */}
            <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(0,0,0,0.3)' }}>
              {([
                { id: 'audit', label: '🔍 Site Audit' },
                { id: 'compare', label: '⚔️ Compare' },
                { id: 'bulk', label: '📊 Bulk Scan' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setMode(tab.id); setError('') }}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={mode === tab.id
                    ? { background: '#AAFF3E', color: '#070A12' }
                    : { color: 'var(--color-muted)' }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Audit */}
              {mode === 'audit' && (
                <div className="relative">
                  <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-11 pr-4 py-4 rounded-xl font-mono text-sm focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-heading)' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(170,255,62,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>
              )}

              {/* Compare */}
              {mode === 'compare' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#00D4FF' }} />
                    <input
                      type="text"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="Your site URL"
                      className="w-full pl-11 pr-4 py-4 rounded-xl font-mono text-sm focus:outline-none transition-all"
                      style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.2)', color: 'var(--color-heading)' }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.5)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
                    />
                  </div>
                  <div className="flex sm:flex-col items-center gap-2 px-1 shrink-0">
                    <div className="flex-1 sm:flex-none sm:h-8 w-px sm:w-px h-px sm:h-auto" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-muted)' }}>VS</span>
                    <div className="flex-1 sm:flex-none sm:h-8 w-px sm:w-px h-px sm:h-auto" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  </div>
                  <div className="relative flex-1">
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#AAFF3E' }} />
                    <input
                      type="text"
                      value={competitorUrl}
                      onChange={e => setCompetitorUrl(e.target.value)}
                      placeholder="Competitor URL"
                      className="w-full pl-11 pr-4 py-4 rounded-xl font-mono text-sm focus:outline-none transition-all"
                      style={{ background: 'rgba(170,255,62,0.04)', border: '1px solid rgba(170,255,62,0.2)', color: 'var(--color-heading)' }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(170,255,62,0.5)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(170,255,62,0.2)')}
                    />
                  </div>
                </div>
              )}

              {/* Bulk */}
              {mode === 'bulk' && (
                <div className="space-y-2">
                  {bulkUrls.map((u, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="relative flex-1">
                        <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
                        <input
                          type="text"
                          value={u}
                          onChange={e => { const next = [...bulkUrls]; next[i] = e.target.value; setBulkUrls(next) }}
                          placeholder={`https://site${i + 1}.com`}
                          className="w-full pl-9 pr-4 py-3 rounded-xl font-mono text-sm focus:outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-heading)' }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(170,255,62,0.4)')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                      </div>
                      {bulkUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBulkUrls(bulkUrls.filter((_, j) => j !== i))}
                          className="p-3 rounded-xl transition-colors"
                          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-muted)' }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {bulkUrls.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setBulkUrls([...bulkUrls, ''])}
                      className="flex items-center gap-2 text-sm py-2 transition-colors"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      <Plus size={16} /> Add URL (max 10)
                    </button>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm font-mono flex items-center gap-2" style={{ color: '#FF6B6B' }}>
                  <span>⚠</span> {error}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>
                  🔬 30+ checks · PageSpeed + Core Web Vitals
                </p>
                <div className="flex items-center gap-3">
                  <a href="#" className="text-sm font-sans" style={{ color: 'var(--color-muted)' }}>Ask question ?</a>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-sans font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                    style={{ background: '#AAFF3E', color: '#070A12', boxShadow: '0 0 24px rgba(170,255,62,0.3)' }}
                  >
                    {mode === 'audit' ? 'Run Audit' : mode === 'compare' ? 'Compare' : 'Bulk Scan'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="relative z-10 max-w-7xl mx-auto px-6 pb-24 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', paddingTop: '5rem' }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <h2 className="font-display leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: 'var(--color-heading)' }}>
            HOW IT WORKS
          </h2>
          <p className="text-sm max-w-xs" style={{ color: 'var(--color-muted)' }}>Four steps to a complete SEO + GEO picture of any website.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '01', label: 'Enter URL', desc: 'Paste any website URL into the audit form' },
            { step: '02', label: 'Deep Scan', desc: 'PageSpeed, Core Web Vitals, and AI checks run in parallel' },
            { step: '03', label: '30+ Checks', desc: 'SEO, GEO, content quality, authority signals all scored' },
            { step: '04', label: 'Get Report', desc: 'Download your full PDF report anytime' },
          ].map((s, i) => (
            <div key={s.step} className="rounded-2xl p-6 relative" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-display text-5xl mb-4 leading-none" style={{ color: 'rgba(170,255,62,0.15)' }}>{s.step}</p>
              <p className="font-sans font-semibold mb-2" style={{ color: 'var(--color-heading)' }}>{s.label}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{s.desc}</p>
              {i < 3 && <div className="hidden lg:block absolute top-8 -right-2 w-4 h-px" style={{ background: '#AAFF3E', opacity: 0.4 }} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t py-8 px-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#AAFF3E" strokeWidth="1.5" strokeOpacity="0.5" />
              <circle cx="16" cy="16" r="2.5" fill="#AAFF3E" />
            </svg>
            <span className="font-display text-sm tracking-widest" style={{ color: 'var(--color-muted)' }}>RANKLENS</span>
          </div>
          <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>SEO + GEO auditing tool · Free · Built with PageSpeed API</p>
        </div>
      </footer>
    </div>
  )
}
