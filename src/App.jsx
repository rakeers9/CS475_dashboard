import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'

// ---------- Mock data ----------
const todayLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
})

const stressTimeline = [
  { time: '8 AM', stress: 28 },
  { time: '9 AM', stress: 32 },
  { time: '10 AM', stress: 35 },
  { time: '11 AM', stress: 41 },
  { time: '12 PM', stress: 46 },
  { time: '1 PM', stress: 39 },
  { time: '2 PM', stress: 55 },
  { time: '3 PM', stress: 72 },
  { time: '4 PM', stress: 64 },
  { time: '5 PM', stress: 51 },
  { time: '6 PM', stress: 44 },
  { time: '7 PM', stress: 36 },
  { time: '8 PM', stress: 31 },
  { time: '9 PM', stress: 27 },
  { time: '10 PM', stress: 24 },
]

const sessionStress = [
  { x: 0, s: 48 }, { x: 1, s: 55 }, { x: 2, s: 62 }, { x: 3, s: 70 },
  { x: 4, s: 74 }, { x: 5, s: 68 }, { x: 6, s: 58 }, { x: 7, s: 64 },
  { x: 8, s: 71 }, { x: 9, s: 60 }, { x: 10, s: 52 },
]

// Phone pickups across the 2h45m session, bucketed every ~15 min
const sessionPickups = [
  { x: 0, p: 0 }, { x: 1, p: 1 }, { x: 2, p: 2 }, { x: 3, p: 0 },
  { x: 4, p: 3 }, { x: 5, p: 1 }, { x: 6, p: 2 }, { x: 7, p: 4 },
  { x: 8, p: 1 }, { x: 9, p: 0 }, { x: 10, p: 1 },
]
const totalPickups = sessionPickups.reduce((a, b) => a + b.p, 0)

// Weekly study log — last 7 days
const weeklyStudy = [
  { day: 'Mon', hours: 2.5, focus: 'med', label: 'Medium' },
  { day: 'Tue', hours: 3.8, focus: 'hi',  label: 'High' },
  { day: 'Wed', hours: 1.2, focus: 'lo',  label: 'Low' },
  { day: 'Thu', hours: 4.1, focus: 'hi',  label: 'High' },
  { day: 'Fri', hours: 0.8, focus: 'lo',  label: 'Low' },
  { day: 'Sat', hours: 3.2, focus: 'med', label: 'Medium' },
  { day: 'Sun', hours: 2.75, focus: 'med', label: 'Medium' },
]
const focusColor = { hi: '#00d4aa', med: '#f59e0b', lo: '#5b6b80' }
const totalStudyHours = weeklyStudy.reduce((a, b) => a + b.hours, 0)
const lastWeekHours = 16.2
const weekDelta = totalStudyHours - lastWeekHours

// Subject breakdown
const subjects = [
  { name: 'CS 374',   hours: 7.4, color: '#00d4aa' },
  { name: 'MATH 415', hours: 4.8, color: '#f59e0b' },
  { name: 'CS 411',   hours: 3.6, color: '#7aa7ff' },
  { name: 'PHIL 110', hours: 2.55, color: '#5b6b80' },
]
const subjectTotal = subjects.reduce((a, b) => a + b.hours, 0)

// Recovery × focus correlation — each dot is a past session
const recoveryFocus = [
  { recovery: 58, focus: 52 }, { recovery: 62, focus: 58 },
  { recovery: 71, focus: 74 }, { recovery: 49, focus: 41 },
  { recovery: 80, focus: 85 }, { recovery: 66, focus: 64 },
  { recovery: 74, focus: 76 }, { recovery: 55, focus: 48 },
  { recovery: 83, focus: 88 }, { recovery: 60, focus: 55 },
  { recovery: 77, focus: 72 }, { recovery: 52, focus: 50 },
  { recovery: 69, focus: 68 }, { recovery: 88, focus: 91 },
]

const cn = (...c) => c.filter(Boolean).join(' ')

// ---------- Atoms ----------
const SectionTitle = ({ children }) => (
  <h2 className="font-display text-lg text-white tracking-wide mb-3">{children}</h2>
)

const ArcProgress = ({ value = 0, max = 100, size = 130, color = '#00d4aa', suffix }) => {
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(1, Math.max(0, value / max))
  const arcLen = c * 0.75
  const dash = arcLen * pct
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2a3a" strokeWidth={stroke} strokeDasharray={`${arcLen} ${c}`} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.22, 1, 0.36, 1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="font-mono text-3xl text-white tabular-nums">
          {value}
          <span className="text-accent-dim text-sm ml-0.5">{suffix || `/${max}`}</span>
        </div>
      </div>
    </div>
  )
}

const Sparkline = ({ data, dataKey = 'steps', color = '#00d4aa', height = 40 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} fill={`url(#spark-${color})`} dot={false} animationDuration={1100} />
    </AreaChart>
  </ResponsiveContainer>
)

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    aria-pressed={checked}
    className="relative rounded-full flex-shrink-0 transition-colors"
    style={{
      width: 40,
      height: 22,
      background: checked ? '#00d4aa' : '#1a2230',
      border: checked ? '1px solid #00d4aa' : '1px solid #1f2a3a',
    }}
  >
    <span
      className="absolute rounded-full bg-white"
      style={{
        width: 16,
        height: 16,
        top: 2,
        left: checked ? 20 : 2,
        transition: 'left 0.18s ease',
      }}
    />
  </button>
)

const METRIC_INFO = {
  readiness: 'Readiness combines recovery, sleep, and HRV trends to estimate how prepared your body is today.',
  sleep: 'Sleep score weighs total sleep time, efficiency, restfulness, and the timing of your sleep cycles.',
  hrv: 'HRV measures the variation between heartbeats. Higher HRV usually signals better recovery and stress resilience.',
}

const MetricCard = ({ id, title, value, max, color, suffix, trend, openId, setOpenId }) => {
  const open = openId === id
  return (
    <button
      onClick={() => setOpenId(open ? null : id)}
      className={cn('panel panel-hover p-6 text-left flex flex-col items-center gap-3', open && 'border-accent-cyan/50')}
    >
      <div className="label-xs self-start">{title}</div>
      <ArcProgress value={value} max={max} color={color} suffix={suffix} />
      {trend && <div className="text-xs text-accent-dim">{trend}</div>}
      {open && (
        <div className="text-xs text-accent-dim leading-relaxed border-t border-bg-border pt-3 mt-1 fade-up text-center">
          {METRIC_INFO[id]}
        </div>
      )}
    </button>
  )
}

// ---------- App ----------
// Format seconds → HH:MM:SS
const formatHMS = (sec) => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function App() {
  const [openMetric, setOpenMetric] = useState(null)
  const [sessionOpen, setSessionOpen] = useState(true)

  const [perceivedQuality, setPerceivedQuality] = useState(3)
  const [sessionNotes, setSessionNotes] = useState('')

  const [stressAlert, setStressAlert] = useState(true)
  const [stressThreshold, setStressThreshold] = useState(75)
  const [breakReminder, setBreakReminder] = useState(true)
  const [dailySummary, setDailySummary] = useState(false)

  // ----- Active study session state -----
  const [subject, setSubject] = useState('CS 374 — Algorithms')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [livePickups, setLivePickups] = useState(0)
  const [liveBreaks, setLiveBreaks] = useState(0)
  const [liveStress, setLiveStress] = useState([{ t: 0, s: 48 }])
  const [completedToday, setCompletedToday] = useState([
    { subject: 'MATH 415 — Linear Algebra', duration: 75 * 60, avgStress: 54, pickups: 9, quality: 4 },
  ])

  // Mock live HR + stress, ticking every second when running
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  // Mock stress sampling every 10s, mock pickup detection
  useEffect(() => {
    if (!running) return
    if (elapsed > 0 && elapsed % 10 === 0) {
      setLiveStress((prev) => {
        const base = 48 + Math.sin(elapsed / 90) * 18 + (Math.random() - 0.5) * 8
        const next = Math.round(Math.max(20, Math.min(95, base)))
        return [...prev, { t: elapsed, s: next }]
      })
    }
    // ~1 in 25 chance per second of a "pickup" when elapsed > 30s
    if (elapsed > 30 && Math.random() < 0.04) {
      setLivePickups((p) => p + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed])

  const currentStress = liveStress[liveStress.length - 1]?.s ?? 48
  const currentHR = Math.round(68 + (currentStress - 48) * 0.4 + (Math.sin(elapsed / 6) * 1.5))

  const handleStart = () => setRunning(true)
  const handlePause = () => setRunning(false)
  const handleBreak = () => {
    setLiveBreaks((b) => b + 1)
    setRunning(false)
  }
  const handleStop = () => {
    if (elapsed < 5) {
      // discard tiny sessions
      setRunning(false)
      setElapsed(0)
      setLiveStress([{ t: 0, s: 48 }])
      setLivePickups(0)
      setLiveBreaks(0)
      return
    }
    const avg = Math.round(liveStress.reduce((a, b) => a + b.s, 0) / liveStress.length)
    setCompletedToday((prev) => [
      { subject, duration: elapsed, avgStress: avg, pickups: livePickups, breaks: liveBreaks, quality: 3 },
      ...prev,
    ])
    setRunning(false)
    setElapsed(0)
    setLiveStress([{ t: 0, s: 48 }])
    setLivePickups(0)
    setLiveBreaks(0)
  }

  return (
    <div className="min-h-screen text-white">
      {/* Top bar */}
      <header className="border-b border-bg-border bg-bg-base/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-cyan pulse-dot" />
            <span className="font-display text-2xl tracking-wider">
              Study<span className="text-accent-cyan">Pulse</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-accent-dim hidden md:inline">{todayLabel}</span>
            <span className="px-3 py-1.5 rounded border border-bg-border bg-bg-panel text-accent-cyan tracking-wider">
              Oura Ring · Day 40
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-10 space-y-10 relative z-10">
        {/* Row 1 */}
        <section>
          <SectionTitle>Recovery snapshot</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard id="readiness" title="Readiness" value={74} max={100} color="#00d4aa" trend="▲ +6 vs yesterday" openId={openMetric} setOpenId={setOpenMetric} />
            <MetricCard id="sleep" title="Sleep" value={68} max={100} color="#f59e0b" trend="▼ −4 vs 7d avg" openId={openMetric} setOpenId={setOpenMetric} />
            <MetricCard id="hrv" title="HRV last night" value={52} max={100} color="#00d4aa" suffix=" ms" trend="▲ +4 ms overnight" openId={openMetric} setOpenId={setOpenMetric} />
          </div>
        </section>

        {/* Active session */}
        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="font-display text-lg text-white tracking-wide">Active session</h2>
            <div className="flex items-center gap-2 text-[11px]">
              <span className={cn('w-2 h-2 rounded-full', running ? 'bg-accent-cyan pulse-dot' : 'bg-accent-dim')} />
              <span className={cn('tracking-[0.18em] uppercase', running ? 'text-accent-cyan' : 'text-accent-dim')}>
                {running ? 'Tracking' : elapsed > 0 ? 'Paused' : 'Idle'}
              </span>
            </div>
          </div>
          <div className="panel p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Timer column */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div>
                  <div className="label-xs mb-2">Subject</div>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={running}
                    placeholder="What are you studying?"
                    className="w-full bg-bg-panel2 border border-bg-border rounded p-3 text-sm text-white placeholder:text-accent-dim/70 focus:outline-none focus:border-accent-cyan/60 transition-colors disabled:opacity-60"
                    style={{ fontFamily: "'DM Mono', ui-monospace, monospace" }}
                  />
                </div>
                <div className="text-center py-2">
                  <div className="label-xs mb-2">Elapsed</div>
                  <div
                    className="font-mono tabular-nums tracking-wider"
                    style={{
                      fontSize: 56,
                      lineHeight: 1,
                      color: running ? '#00d4aa' : '#ffffff',
                      textShadow: running ? '0 0 24px rgba(0,212,170,0.35)' : 'none',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {formatHMS(elapsed)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {!running ? (
                    <button
                      onClick={handleStart}
                      className="col-span-3 py-3 rounded font-display tracking-wider text-sm transition-colors"
                      style={{
                        background: '#00d4aa',
                        color: '#0d1117',
                        boxShadow: '0 0 20px rgba(0,212,170,0.4)',
                      }}
                    >
                      {elapsed > 0 ? 'RESUME' : 'START SESSION'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handlePause}
                        className="py-3 rounded font-display tracking-wider text-sm border border-bg-border bg-bg-panel2 hover:border-accent-cyan/50 transition-colors"
                      >
                        PAUSE
                      </button>
                      <button
                        onClick={handleBreak}
                        className="py-3 rounded font-display tracking-wider text-sm border border-accent-amber/40 bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20 transition-colors"
                      >
                        BREAK
                      </button>
                      <button
                        onClick={handleStop}
                        className="py-3 rounded font-display tracking-wider text-sm border border-bg-border bg-bg-panel2 text-white hover:border-red-400/50 hover:text-red-400 transition-colors"
                      >
                        END
                      </button>
                    </>
                  )}
                  {!running && elapsed > 0 && (
                    <button
                      onClick={handleStop}
                      className="col-span-3 py-2 mt-1 rounded font-display tracking-wider text-xs border border-bg-border text-accent-dim hover:text-white transition-colors"
                    >
                      SAVE & END SESSION
                    </button>
                  )}
                </div>
              </div>

              {/* Live stats column */}
              <div className="lg:col-span-3 lg:border-l border-bg-border lg:pl-8 grid grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <div className="label-xs mb-1">Heart rate</div>
                  <div className="font-mono text-3xl tabular-nums">
                    {running ? currentHR : '—'}
                    <span className="text-accent-dim text-base"> bpm</span>
                  </div>
                </div>
                <div>
                  <div className="label-xs mb-1">Current stress</div>
                  <div
                    className="font-mono text-3xl tabular-nums"
                    style={{ color: currentStress > 70 ? '#f59e0b' : currentStress > 50 ? '#ffffff' : '#00d4aa' }}
                  >
                    {running ? currentStress : '—'}
                  </div>
                </div>
                <div>
                  <div className="label-xs mb-1">Phone pickups</div>
                  <div className="font-mono text-3xl tabular-nums text-accent-amber">{livePickups}</div>
                </div>
                <div>
                  <div className="label-xs mb-1">Breaks</div>
                  <div className="font-mono text-3xl tabular-nums">{liveBreaks}</div>
                </div>
                <div className="col-span-2">
                  <div className="label-xs mb-2">Stress · live</div>
                  <div className="h-16">
                    {liveStress.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={liveStress} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
                          <defs>
                            <linearGradient id="live-stress-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#00d4aa" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="s" stroke="#00d4aa" strokeWidth={1.5} fill="url(#live-stress-grad)" dot={false} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-accent-dim border border-dashed border-bg-border rounded">
                        Waiting for first reading…
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Today's completed sessions */}
            <div className="mt-6 pt-5 border-t border-bg-border">
              <div className="label-xs mb-3">Sessions today · {completedToday.length}</div>
              {completedToday.length === 0 ? (
                <div className="text-xs text-accent-dim">No completed sessions yet.</div>
              ) : (
                <div className="space-y-2">
                  {completedToday.map((s, i) => (
                    <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center px-3 py-2.5 rounded border border-bg-border bg-bg-panel2/40 text-sm fade-up">
                      <div className="md:col-span-2 truncate text-white">{s.subject}</div>
                      <div className="font-mono tabular-nums text-accent-cyan">{formatHMS(s.duration)}</div>
                      <div className="text-xs"><span className="text-accent-dim">stress </span><span className="font-mono tabular-nums text-white">{s.avgStress}</span></div>
                      <div className="text-xs"><span className="text-accent-dim">pickups </span><span className="font-mono tabular-nums text-accent-amber">{s.pickups}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Row 3 */}
        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="font-display text-lg text-white tracking-wide">Stress &amp; focus timeline</h2>
            <div className="flex items-center gap-4 text-[11px] text-accent-dim">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-accent-amber/60 rounded-sm" />Study</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-accent-cyan rounded-sm" />Stress</span>
            </div>
          </div>
          <div className="panel p-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stressTimeline} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#1f2a3a" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="time" stroke="#5b6b80" fontSize={11} tickLine={false} axisLine={{ stroke: '#1f2a3a' }} />
                  <YAxis domain={[0, 100]} stroke="#5b6b80" fontSize={11} tickLine={false} axisLine={false} width={40} />
                  <ReferenceArea x1="2 PM" x2="5 PM" fill="#f59e0b" fillOpacity={0.07} stroke="#f59e0b" strokeOpacity={0.3} strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{ background: '#0d1117', border: '1px solid #1f2a3a', borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: '#5b6b80', fontSize: 11 }}
                    itemStyle={{ color: '#00d4aa' }}
                    formatter={(v) => [v, 'Stress']}
                  />
                  <Line type="monotone" dataKey="stress" stroke="#00d4aa" strokeWidth={2} dot={{ r: 2.5, fill: '#00d4aa', stroke: '#00d4aa' }} activeDot={{ r: 5, fill: '#00d4aa', stroke: '#0d1117', strokeWidth: 2 }} animationDuration={1400} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-5">
              <div className="border-l-2 border-l-accent-amber pl-4">
                <div className="label-xs mb-1">Avg during study</div>
                <div className="font-mono text-2xl text-accent-amber tabular-nums">61</div>
              </div>
              <div className="border-l-2 border-l-accent-cyan pl-4">
                <div className="label-xs mb-1">Avg outside study</div>
                <div className="font-mono text-2xl text-accent-cyan tabular-nums">38</div>
              </div>
            </div>
          </div>
        </section>

        {/* Row 4 */}
        <section>
          <SectionTitle>Optimal windows</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="panel p-5 border-l-2 border-l-accent-cyan flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-accent-cyan/10 flex items-center justify-center text-accent-cyan flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 0 0 12 18Z"/>
                  <path d="M12 5a3 3 0 1 1 5.997.142 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 0 1 12 18Z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="label-xs mb-1">Best for deep work</div>
                <div className="font-display text-xl text-white">9 — 11 AM</div>
              </div>
            </div>
            <div className="panel p-5 border-l-2 border-l-accent-amber flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-accent-amber/10 flex items-center justify-center text-accent-amber flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13" cy="4" r="2"/>
                  <path d="m5 22 4-7 5 1 1-4-3-3 2-3"/>
                  <path d="M14 13h3l2 3"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="label-xs mb-1">Best for activity</div>
                <div className="font-display text-xl text-white">5 — 7 PM</div>
              </div>
            </div>
          </div>
        </section>

        {/* Row 5 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-white tracking-wide">Study session</h2>
            <button onClick={() => setSessionOpen(!sessionOpen)} className="text-xs text-accent-dim hover:text-white transition-colors">
              {sessionOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>
          {sessionOpen && (
            <div className="panel p-6 fade-up">
              <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
                <div>
                  <div className="font-display text-xl text-white">CS 374 — Algorithms</div>
                  <div className="text-xs text-accent-dim mt-0.5">2:00 PM — 4:45 PM</div>
                </div>
                <div className="font-mono text-2xl tabular-nums text-accent-cyan">2h 45m</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="label-xs mb-2">Stress trend</div>
                  <Sparkline data={sessionStress} dataKey="s" color="#f59e0b" height={48} />
                </div>
                <div>
                  <div className="label-xs mb-2">Focus quality</div>
                  <div className="font-display text-xl text-accent-amber">Medium</div>
                </div>
                <div>
                  <div className="label-xs mb-2">Breaks taken</div>
                  <div className="font-mono text-xl tabular-nums">
                    1<span className="text-accent-dim text-sm"> / 2 rec.</span>
                  </div>
                </div>
                <div>
                  <div className="label-xs mb-2">Phone pickups</div>
                  <div className="flex items-baseline gap-2">
                    <div className="font-mono text-xl tabular-nums text-accent-amber">{totalPickups}</div>
                    <div className="text-xs text-accent-dim">in session</div>
                  </div>
                  <div className="h-6 mt-1">
                    <Sparkline data={sessionPickups} dataKey="p" color="#f59e0b" height={24} />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-bg-border grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="label-xs mb-2">Perceived quality</div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setPerceivedQuality(n)}
                        className="rounded-sm transition-colors"
                        style={{
                          width: 28,
                          height: 28,
                          background: n <= perceivedQuality ? '#00d4aa' : '#1a2230',
                          border: n <= perceivedQuality ? '1px solid #00d4aa' : '1px solid #1f2a3a',
                          boxShadow: n <= perceivedQuality ? '0 0 10px rgba(0,212,170,0.35)' : 'none',
                        }}
                        aria-label={`Rate ${n}`}
                      />
                    ))}
                    <span className="ml-3 font-mono text-sm text-accent-dim tabular-nums">
                      {perceivedQuality} / 5
                    </span>
                  </div>
                  <div className="text-[11px] text-accent-dim mt-2">
                    {['', 'Rough', 'Below avg', 'Solid', 'Strong', 'Locked in'][perceivedQuality]}
                  </div>
                </div>
                <div>
                  <div className="label-xs mb-2">Notes</div>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="What went well? What threw you off?"
                    rows={3}
                    className="w-full bg-bg-panel2 border border-bg-border rounded p-3 text-sm text-white placeholder:text-accent-dim/70 resize-none focus:outline-none focus:border-accent-cyan/60 transition-colors"
                    style={{ fontFamily: "'DM Mono', ui-monospace, monospace" }}
                  />
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-bg-border flex items-start gap-3">
                <div className="w-1 self-stretch bg-accent-amber rounded-full flex-shrink-0" />
                <div>
                  <div className="label-xs text-accent-amber mb-1">Post-session note</div>
                  <p className="text-sm text-white/90 leading-relaxed">
                    Consider a short walk — your stress stayed elevated for 40+ min after the session ended.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Weekly study log */}
        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="font-display text-lg text-white tracking-wide">This week's study log</h2>
            <div className="flex items-center gap-3 text-[11px] text-accent-dim">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: '#00d4aa' }} />High</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: '#f59e0b' }} />Medium</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: '#5b6b80' }} />Low</span>
            </div>
          </div>
          <div className="panel p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="label-xs mb-1">Total this week</div>
                <div className="font-mono text-2xl tabular-nums">
                  {totalStudyHours.toFixed(1)}<span className="text-accent-dim text-base"> h</span>
                </div>
              </div>
              <div>
                <div className="label-xs mb-1">vs last week</div>
                <div className={cn('font-mono text-2xl tabular-nums', weekDelta >= 0 ? 'text-accent-cyan' : 'text-accent-amber')}>
                  {weekDelta >= 0 ? '▲' : '▼'} {Math.abs(weekDelta).toFixed(1)}<span className="text-accent-dim text-base"> h</span>
                </div>
              </div>
              <div>
                <div className="label-xs mb-1">Avg / day</div>
                <div className="font-mono text-2xl tabular-nums">
                  {(totalStudyHours / 7).toFixed(1)}<span className="text-accent-dim text-base"> h</span>
                </div>
              </div>
              <div>
                <div className="label-xs mb-1">Best day</div>
                <div className="font-display text-2xl text-accent-cyan">Thu</div>
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyStudy} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#1f2a3a" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="day" stroke="#5b6b80" fontSize={11} tickLine={false} axisLine={{ stroke: '#1f2a3a' }} />
                  <YAxis stroke="#5b6b80" fontSize={11} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,212,170,0.05)' }}
                    contentStyle={{ background: '#0d1117', border: '1px solid #1f2a3a', borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: '#5b6b80', fontSize: 11 }}
                    formatter={(v, _n, p) => [`${v} h · ${p.payload.label}`, 'Study']}
                  />
                  <Bar dataKey="hours" radius={[3, 3, 0, 0]} animationDuration={1100}>
                    {weeklyStudy.map((d, i) => <Cell key={i} fill={focusColor[d.focus]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Subject breakdown */}
            <div className="mt-6 pt-5 border-t border-bg-border">
              <div className="label-xs mb-3">By subject</div>
              <div className="space-y-3">
                {subjects.map((s) => {
                  const pct = (s.hours / subjectTotal) * 100
                  return (
                    <div key={s.name}>
                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span className="text-white">{s.name}</span>
                        <span className="font-mono tabular-nums text-accent-dim">
                          {s.hours.toFixed(1)} h <span className="text-accent-dim/60">· {Math.round(pct)}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-bg-panel2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: s.color, transition: 'width 1s ease' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Recovery × Focus correlation */}
        <section>
          <SectionTitle>Recovery × focus</SectionTitle>
          <div className="panel p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="label-xs mb-2">Last 14 study sessions</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 16, left: -10, bottom: 8 }}>
                    <CartesianGrid stroke="#1f2a3a" strokeDasharray="2 4" />
                    <XAxis
                      type="number"
                      dataKey="recovery"
                      name="Recovery"
                      domain={[40, 100]}
                      stroke="#5b6b80"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#1f2a3a' }}
                      label={{ value: 'Recovery score', position: 'insideBottom', offset: -4, fill: '#5b6b80', fontSize: 10, letterSpacing: 1.5 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="focus"
                      name="Focus"
                      domain={[30, 100]}
                      stroke="#5b6b80"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <ZAxis range={[80, 80]} />
                    <Tooltip
                      cursor={{ stroke: '#00d4aa', strokeOpacity: 0.3, strokeDasharray: '3 3' }}
                      contentStyle={{ background: '#0d1117', border: '1px solid #1f2a3a', borderRadius: 6, fontSize: 12 }}
                      labelStyle={{ display: 'none' }}
                      formatter={(v, n) => [v, n]}
                    />
                    <Scatter data={recoveryFocus} fill="#00d4aa" fillOpacity={0.7} stroke="#00d4aa" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="border-t lg:border-t-0 lg:border-l border-bg-border lg:pl-8 pt-6 lg:pt-0 flex flex-col justify-center gap-4">
              <div>
                <div className="label-xs mb-1">Correlation</div>
                <div className="font-mono text-3xl tabular-nums text-accent-cyan">+0.82</div>
                <div className="text-xs text-accent-dim mt-1">strong positive</div>
              </div>
              <div className="border-t border-bg-border pt-4">
                <div className="label-xs text-accent-cyan mb-2">Insight</div>
                <p className="text-sm text-white/90 leading-relaxed">
                  Sessions following a recovery score above <span className="text-accent-cyan font-mono">70</span> show on average <span className="text-accent-cyan font-mono">23%</span> better focus than days below it.
                </p>
              </div>
              <div className="border-t border-bg-border pt-4">
                <div className="label-xs mb-2">Recommendation</div>
                <p className="text-xs text-accent-dim leading-relaxed">
                  Aim for 7+ hours of sleep tonight — tomorrow's CS 374 deadline benefits most from a high-recovery day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Row 6 */}
        <section>
          <SectionTitle>Notifications</SectionTitle>
          <div className="panel divide-y divide-bg-border">
            <div className="p-5 flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="text-sm text-white">Alert when stress exceeds threshold</div>
                {stressAlert && (
                  <div className="mt-4 max-w-xs fade-up">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-accent-dim">Threshold</span>
                      <span className="font-mono tabular-nums text-accent-cyan">{stressThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="90"
                      value={stressThreshold}
                      onChange={e => setStressThreshold(Number(e.target.value))}
                      className="sp-slider w-full"
                    />
                  </div>
                )}
              </div>
              <Toggle checked={stressAlert} onChange={setStressAlert} />
            </div>
            <div className="p-5 flex items-center justify-between gap-6">
              <div className="text-sm text-white">Remind me to take a break after 60 min sedentary</div>
              <Toggle checked={breakReminder} onChange={setBreakReminder} />
            </div>
            <div className="p-5 flex items-center justify-between gap-6">
              <div className="text-sm text-white">Daily summary at end of study session</div>
              <Toggle checked={dailySummary} onChange={setDailySummary} />
            </div>
          </div>
        </section>

        <footer className="pt-2 pb-8 text-center label-xs">
          StudyPulse · Mock data
        </footer>
      </main>
    </div>
  )
}
