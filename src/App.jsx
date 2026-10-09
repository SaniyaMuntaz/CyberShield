import { useEffect, useState } from 'react'
import {
  ShieldCheck, LayoutDashboard, FilePlus2, History, Search,
  Bell, Menu, X, ArrowRight, MessageSquareWarning,
  CalendarDays, Trash2, LockKeyhole, HeartHandshake,
  ChevronRight, CheckCircle2, AlertTriangle, Eye
} from 'lucide-react'
import StatCard from './components/StatCard'
import IncidentRow from './components/IncidentRow'
const API_BASE_URL = 'https://cybershield-backend-4ugg.onrender.com'
const demoIncidents = [
  {
    id: 1,
    message: 'You do not belong here. Nobody wants you around.',
    platform: 'Instagram',
    date: '2026-10-06',
    notes: 'Example incident for demonstration.',
    status: 'Documented',
  },
  {
    id: 2,
    message: 'Someone keeps sending unwanted messages after I asked them to stop.',
    platform: 'WhatsApp',
    date: '2026-10-07',
    notes: 'Example incident for demonstration.',
    status: 'Documented',
  },
]

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'report', label: 'Report incident', icon: FilePlus2 },
  { id: 'history', label: 'Incident history', icon: History },
]

function App() {
  const [page, setPage] = useState('dashboard')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [incidents, setIncidents] = useState(() => {
    try {
      const saved = localStorage.getItem('cybershield-incidents')
      return saved ? JSON.parse(saved) : demoIncidents
    } catch {
      return demoIncidents
    }
  })
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')

  const [supportGoal, setSupportGoal] = useState('understand_next_steps')
  const [supportResponse, setSupportResponse] = useState('')
  const [supportError, setSupportError] = useState('')
  const [isSupporting, setIsSupporting] = useState(false)

  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')

  // Safety Agent state
  const [agentPlan, setAgentPlan] = useState(null)
  const [agentError, setAgentError] = useState('')
  const [isPlanning, setIsPlanning] = useState(false)

  const [form, setForm] = useState({
    message: '',
    platform: 'Instagram',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  useEffect(() => {
    localStorage.setItem('cybershield-incidents', JSON.stringify(incidents))
  }, [incidents])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(timer)
  }, [notice])

  function navigate(nextPage) {
    setPage(nextPage)
    setMobileMenu(false)
  }

  async function analyzeMessage() {
    const message = form.message.trim()

    if (message.length < 3) {
      setAnalysisError('Please enter at least 3 characters to analyze.')
      setAnalysis(null)
      return
    }

    setIsAnalyzing(true)
    setAnalysisError('')
    setAnalysis(null)

    try {
      const response = await fetch('https://cybershield-backend-4ugg.onrender.com/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: message }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail?.[0]?.msg || 'Analysis failed.')
      }

      setAnalysis(data)
      // Clear any previous agent plan because the message has been re-analyzed.
      setAgentPlan(null)
      setAgentError('')
    } catch (error) {
      setAnalysisError(
        'Could not connect to the ML backend. Check that your Python server is running.'
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function getSupportGuidance() {
    const message = form.message.trim()

    if (message.length < 3) {
      setSupportError('Please enter at least 3 characters in the message field.')
      setSupportResponse('')
      return
    }

    setIsSupporting(true)
    setSupportError('')
    setSupportResponse('')

    try {
      const flaggedCategories = (analysis?.results || [])
        .filter((item) => item.flagged)
        .map((item) => item.label)

      const response = await fetch('https://cybershield-backend-4ugg.onrender.com/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          flagged_categories: flaggedCategories,
          support_goal: supportGoal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Could not generate support guidance.')
      }

      setSupportResponse(data.guidance || 'No guidance was returned.')
    } catch (error) {
      setSupportError(
        'Could not connect to the AI assistant. Check that your Python backend is running and try again.'
      )
    } finally {
      setIsSupporting(false)
    }
  }

  // Safety Agent: obtain fresh ML results, then request a rule-based plan.
  async function createAgentPlan() {
    const message = form.message.trim()

    if (message.length < 3) {
      setAgentError('Enter at least 3 characters first.')
      setAgentPlan(null)
      return
    }

    setIsPlanning(true)
    setAgentError('')
    setAgentPlan(null)

    try {
      const mlResponse = await fetch('https://cybershield-backend-4ugg.onrender.com/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      })

      const mlData = await mlResponse.json()

      if (!mlResponse.ok) {
        throw new Error(
          typeof mlData.detail === 'string'
            ? mlData.detail
            : 'ML analysis failed.'
        )
      }

      setAnalysis(mlData)

      const flaggedCategories = (mlData.results || [])
        .filter((item) => item.flagged)
        .map((item) => item.label)

      const response = await fetch('https://cybershield-backend-4ugg.onrender.com/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          flagged_categories: flaggedCategories,
          support_goal: supportGoal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'The safety agent failed. Check that the backend endpoint exists.'
        )
      }

      setAgentPlan(data)
    } catch (error) {
      setAgentError(
        error.message ||
          'Could not connect to the safety agent. Check that your backend is running.'
      )
    } finally {
      setIsPlanning(false)
    }
  }

  function submitIncident(event) {
    event.preventDefault()
    const newIncident = {
      ...form,
      id: Date.now(),
      status: 'Documented',
    }
    setIncidents(current => [newIncident, ...current])
    setForm({
      message: '',
      platform: 'Instagram',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
    })
    setAnalysis(null)
    setAnalysisError('')
    setSupportResponse('')
    setSupportError('')
    setAgentPlan(null)
    setAgentError('')
    setNotice('Incident saved successfully.')
    setPage('history')
  }

  function deleteIncident(id) {
    setIncidents(current => current.filter(item => item.id !== id))
    setNotice('Incident removed from your history.')
  }

  const filteredIncidents = incidents.filter(item =>
    `${item.message} ${item.platform} ${item.notes}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const today = new Date().toISOString().slice(0, 10)
  const recentCount = incidents.filter(item => item.date === today).length

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      {mobileMenu && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:translate-x-0 ${mobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <button onClick={() => navigate('dashboard')} className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">CyberShield</div>
              <div className="text-xs text-slate-500">Your online safety space</div>
            </div>
          </button>
          <button className="md:hidden" onClick={() => setMobileMenu(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-8">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Workspace</p>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon
              const active = page === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <Icon size={19} />
                  {item.label}
                  {active && <ChevronRight size={16} className="ml-auto" />}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <LockKeyhole size={18} />
            </div>
            <p className="text-sm font-semibold">Your privacy matters</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Your records stay in this browser in this prototype. Avoid entering real sensitive information.
            </p>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">CyberShield · Student project</p>
        </div>
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 hover:bg-slate-100 md:hidden" onClick={() => setMobileMenu(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <div>
              <p className="text-sm text-slate-500">Your safety, your choices</p>
              <h1 className="text-lg font-bold">
                {page === 'dashboard' ? 'Dashboard' : page === 'report' ? 'Report an incident' : 'Incident history'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 sm:inline-flex sm:items-center sm:gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Private workspace
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
              <Bell size={19} />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-8">
          {notice && (
            <div role="status" className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 size={18} /> {notice}
            </div>
          )}

          {page === 'dashboard' && (
            <div className="space-y-7">
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white sm:p-9">
                <div className="relative z-10 max-w-2xl">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium">
                    <ShieldCheck size={15} /> Online safety companion
                  </span>
                  <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
                    You deserve to feel safe online.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                    Keep a record of unwanted online interactions, organize incidents, and prepare to take your next step.
                  </p>
                  <button onClick={() => navigate('report')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50">
                    Document an incident <ArrowRight size={17} />
                  </button>
                </div>
                <ShieldCheck className="absolute -bottom-12 -right-8 hidden h-64 w-64 text-white/10 sm:block" strokeWidth={1} />
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard icon={History} label="Total incidents recorded" value={incidents.length} color="indigo" detail="All saved records" />
                <StatCard icon={CalendarDays} label="Recorded today" value={recentCount} color="amber" detail="Based on incident date" />
                <StatCard icon={LockKeyhole} label="Privacy-first records" value="Local" color="emerald" detail="Stored in this browser" />
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">Recent incidents</h3>
                      <p className="mt-1 text-sm text-slate-500">Your latest saved records</p>
                    </div>
                    <button onClick={() => navigate('history')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">View all</button>
                  </div>
                  <div className="mt-5 space-y-3">
                    {incidents.slice(0, 3).map(item => (
                      <IncidentRow key={item.id} item={item} />
                    ))}
                    {incidents.length === 0 && <EmptyState text="No incidents recorded yet. You can start whenever you're ready." />}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <HeartHandshake size={23} />
                  </div>
                  <h3 className="mt-4 font-bold">A gentle reminder</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Online harassment is not your fault. You can take time before responding and choose the steps that feel safe for you.
                  </p>
                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    <p className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" /> Save relevant messages or screenshots securely.</p>
                    <p className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" /> Consider blocking or reporting the account.</p>
                    <p className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" /> Reach out to someone you trust if needed.</p>
                  </div>
                </div>
              </section>

              <PrivacyNotice />
            </div>
          )}

          {page === 'report' && (
            <section className="mx-auto max-w-3xl">
              <div className="mb-6">
                <p className="text-sm font-medium text-indigo-600">Document safely</p>
                <h2 className="mt-1 text-2xl font-bold">Record an online incident</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add details you want to remember. This form does not send anything to a social media platform or another person.
                </p>
              </div>
              <form onSubmit={submitIncident} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-semibold">Message or incident description *</label>
                  <textarea id="message" required minLength={3} maxLength={5000} rows={5} value={form.message} onChange={e => {
                    setForm({ ...form, message: e.target.value })
                    setAnalysis(null)
                    setAgentPlan(null)
                  }} placeholder="Describe what happened, or enter the message you want to document..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                  <p className="mt-1 text-right text-xs text-slate-400">{form.message.length}/5000</p>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={analyzeMessage}
                      disabled={isAnalyzing || !form.message.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAnalyzing ? 'Analyzing message...' : 'Analyze message with ML'}
                    </button>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Your text is sent to the local CyberShield backend for analysis.
                      Predictions are indicators of language patterns, not proof of bullying.
                    </p>
                  </div>

                  {analysisError && (
                    <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                      {analysisError}
                    </div>
                  )}

                  {analysis && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                      <h3 className="font-bold text-slate-800">Language analysis</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        The model has analyzed your text for six categories of potentially harmful language.
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {analysis.results.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <div>
                              <p className="text-sm font-medium capitalize text-slate-700">
                                {item.label.replaceAll('_', ' ')}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Model score: {(item.score * 100).toFixed(1)}%
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                item.flagged
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.flagged ? 'Flagged' : 'Not flagged'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="mt-4 text-xs leading-5 text-slate-500">
                        {analysis.warning}
                      </p>
                    </div>
                  )}

                  {/* Gemini AI Support */}
                  <div className="mt-6 rounded-2xl border border-indigo-100 bg-white p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <HeartHandshake size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">CyberShield AI Support</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Get supportive guidance and practical next steps for your situation.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label htmlFor="supportGoal" className="mb-2 block text-sm font-medium text-slate-700">
                        What would you like help with?
                      </label>
                      <select
                        id="supportGoal"
                        value={supportGoal}
                        onChange={(event) => setSupportGoal(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-400"
                      >
                        <option value="understand_next_steps">Understand what to do next</option>
                        <option value="document_incident">Learn how to document the incident</option>
                        <option value="platform_safety">Learn about blocking and reporting</option>
                        <option value="emotional_support">Get emotional support</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={getSupportGuidance}
                      disabled={isSupporting || !form.message.trim()}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <HeartHandshake size={18} />
                      {isSupporting ? 'Preparing guidance...' : 'Get AI Support'}
                    </button>

                    {supportError && (
                      <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        {supportError}
                      </div>
                    )}

                    {isSupporting && (
                      <p className="mt-4 text-sm text-slate-500">
                        Your assistant is preparing guidance. Please wait...
                      </p>
                    )}

                    {supportResponse && (
                      <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                        <h4 className="font-semibold text-slate-800">Your support guidance</h4>
                        <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {supportResponse}
                        </div>
                        <p className="mt-4 border-t border-indigo-100 pt-3 text-xs leading-5 text-slate-500">
                          This is AI-generated general guidance, not a definitive judgment
                          about bullying. Review the suggestions and choose what feels safe
                          and appropriate for your situation.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CyberShield Safety Agent */}
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">CyberShield Safety Agent</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Generate a safety plan using fresh ML predictions and your selected support goal.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={createAgentPlan}
                      disabled={isPlanning || !form.message.trim()}
                      className="mt-4 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPlanning ? 'Creating safety plan...' : 'Create Safety Plan'}
                    </button>

                    {agentError && (
                      <p role="alert" className="mt-3 text-sm text-rose-700">{agentError}</p>
                    )}

                    {isPlanning && (
                      <p className="mt-3 text-sm text-slate-500">
                        Analyzing the message and preparing recommendations...
                      </p>
                    )}

                    {agentPlan && (
                      <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4">
                        <h4 className="font-bold text-slate-800">Your safety plan</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {agentPlan.decision_summary}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-amber-800">
                          {agentPlan.priority_note}
                        </p>
                        <h5 className="mt-4 text-sm font-semibold text-slate-800">
                          Recommended next steps
                        </h5>
                        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
                          {(agentPlan.recommended_steps || []).map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                        <p className="mt-4 text-xs leading-5 text-slate-500">
                          Review these suggestions and choose what feels safe for you.
                          ML flags are not proof of bullying.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="platform" className="mb-2 block text-sm font-semibold">Platform *</label>
                    <select id="platform" required value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50">
                      {['Instagram', 'WhatsApp', 'Facebook', 'X', 'YouTube', 'Discord', 'Online game', 'Other'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="date" className="mb-2 block text-sm font-semibold">Date of incident *</label>
                    <input id="date" type="date" required max={today} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="mb-2 block text-sm font-semibold">Additional notes <span className="font-normal text-slate-400">(optional)</span></label>
                  <textarea id="notes" rows={3} maxLength={2000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Anything else you want to remember..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
                </div>

                <div className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  <div className="flex gap-2 font-semibold"><LockKeyhole size={18} className="mt-0.5 shrink-0" /> Before saving</div>
                  <p className="mt-1">This prototype saves records in your browser. Do not enter passwords, financial details, or information you would not want stored on this device.</p>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => navigate('dashboard')} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"><FilePlus2 size={17} /> Save incident</button>
                </div>
              </form>
            </section>
          )}

          {page === 'history' && (
            <section>
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Your records</p>
                  <h2 className="mt-1 text-2xl font-bold">Incident history</h2>
                  <p className="mt-2 text-sm text-slate-500">Search and manage the incidents saved in this browser.</p>
                </div>
                <button onClick={() => navigate('report')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"><FilePlus2 size={17} /> New incident</button>
              </div>

              <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Search size={19} className="text-slate-400" />
                <input aria-label="Search incidents" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by message, platform or notes..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
                {search && <button onClick={() => setSearch('')} className="text-xs font-semibold text-indigo-600">Clear</button>}
              </div>

              <div className="space-y-4">
                {filteredIncidents.map(item => (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{item.platform}</span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{item.status}</span>
                          <span className="text-xs text-slate-400">{item.date}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.message}</p>
                        {item.notes && <p className="mt-3 text-sm leading-6 text-slate-500">Notes: {item.notes}</p>}
                      </div>
                      <button onClick={() => { if (window.confirm('Delete this incident from your browser history?')) deleteIncident(item.id) }} className="inline-flex h-fit items-center justify-center gap-2 rounded-lg border border-rose-100 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </article>
                ))}
                {filteredIncidents.length === 0 && <EmptyState text={search ? 'No incidents match your search.' : 'No incidents recorded yet. Add one whenever you are ready.'} />}
              </div>
              <p className="mt-6 text-xs leading-5 text-slate-400">Records are stored in local browser storage, not securely encrypted or backed up. Clearing browser data may delete them.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
      <Eye className="mx-auto text-slate-300" size={28} />
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">{text}</p>
    </div>
  )
}

function PrivacyNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="rounded-xl bg-slate-100 p-2 text-slate-600"><AlertTriangle size={19} /></div>
      <div>
        <p className="text-sm font-semibold">A note about AI and safety</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          CyberShield is a student prototype, not an emergency service. Its AI features offer supportive guidance, not determine guilt or replace trusted people, professional care, or official reporting channels.
        </p>
      </div>
    </div>
  )
}

export default App
