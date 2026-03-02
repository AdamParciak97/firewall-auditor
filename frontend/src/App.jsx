import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import ReactMarkdown from 'react-markdown'

const API_URL = 'http://localhost:8000'
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

// ─── SCORE GAUGE ────────────────────────────────────────────────────────────
function ScoreGauge({ score, grade, color }) {
  const colors = { green: '#22c55e', yellow: '#eab308', orange: '#f97316', red: '#ef4444' }
  const c = colors[color] || '#3b82f6'
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1f2937" strokeWidth="12" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={c} strokeWidth="12"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="60" y="55" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">{score}</text>
        <text x="60" y="72" textAnchor="middle" fill="#9ca3af" fontSize="10">/100</text>
      </svg>
      <div style={{ color: c }} className="text-xl font-bold mt-2">{grade}</div>
    </div>
  )
}

// ─── MITRE TABLE ─────────────────────────────────────────────────────────────
function MitreTable({ mitre }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 mt-6">
      <h3 className="text-white font-semibold mb-4">🎯 Mapowanie MITRE ATT&CK</h3>
      <table className="w-full text-sm text-gray-300">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="text-left py-2 px-3">Reguła</th>
            <th className="text-left py-2 px-3">Taktyka</th>
            <th className="text-left py-2 px-3">Technika</th>
            <th className="text-left py-2 px-3">Opis zagrożenia</th>
          </tr>
        </thead>
        <tbody>
          {mitre.map((m, i) => (
            <tr key={i} className="border-b border-gray-800 hover:bg-gray-800">
              <td className="py-2 px-3 font-medium text-white">{m.rule}</td>
              <td className="py-2 px-3">
                <span className="bg-purple-900 text-purple-200 px-2 py-1 rounded text-xs font-bold">
                  {m.tactic}
                </span>
              </td>
              <td className="py-2 px-3 text-blue-400 font-mono text-xs">{m.technique}</td>
              <td className="py-2 px-3 text-gray-400">{m.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── SCORE VIEW ──────────────────────────────────────────────────────────────
function ScoreView({ data }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="bg-gray-900 rounded-lg p-6 flex flex-col items-center justify-center">
          <h3 className="text-white font-semibold mb-4">🛡️ Security Score</h3>
          <ScoreGauge score={data.score} grade={data.grade} color={data.color} />
        </div>
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">📋 Podsumowanie problemów</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-900 rounded-lg">
              <span className="text-red-200">🔴 Krytyczne</span>
              <span className="text-white font-bold text-xl">{data.summary.critical}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-900 rounded-lg">
              <span className="text-orange-200">🟠 Wysokie</span>
              <span className="text-white font-bold text-xl">{data.summary.high}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-900 rounded-lg">
              <span className="text-yellow-200">🟡 Średnie</span>
              <span className="text-white font-bold text-xl">{data.summary.medium}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-white font-semibold mb-4">⚠️ Wykryte problemy</h3>
        <div className="space-y-2">
          {data.findings.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
              <span className={`px-2 py-1 rounded text-xs font-bold shrink-0 ${
                f.severity === 'KRYTYCZNY' ? 'bg-red-600 text-white' :
                f.severity === 'WYSOKI' ? 'bg-orange-500 text-white' :
                'bg-yellow-500 text-black'}`}>
                {f.severity}
              </span>
              <div>
                <div className="text-blue-400 text-xs font-mono mb-1">{f.rule}</div>
                <div className="text-gray-300 text-sm">{f.issue}</div>
              </div>
              <span className="ml-auto text-red-400 font-bold shrink-0">{f.points} pkt</span>
            </div>
          ))}
        </div>
      </div>

      <MitreTable mitre={data.mitre} />
    </div>
  )
}

// ─── STATS CARDS ─────────────────────────────────────────────────────────────
function StatsCards({ stats }) {
  const cards = [
    { label: 'Wszystkich reguł', value: stats.total, color: 'bg-blue-900 border-blue-600' },
    { label: 'Reguły ALLOW', value: stats.allow, color: 'bg-green-900 border-green-600' },
    { label: 'Reguły DENY', value: stats.deny, color: 'bg-red-900 border-red-600' },
    { label: 'Source: ANY', value: stats.any_source, color: 'bg-orange-900 border-orange-600' },
    { label: 'Destination: ANY', value: stats.any_destination, color: 'bg-orange-900 border-orange-600' },
    { label: 'Application: ANY', value: stats.any_application, color: 'bg-yellow-900 border-yellow-600' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
      {cards.map((c, i) => (
        <div key={i} style={{ border: '1px solid', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center' }}
          className={c.color}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>{c.value}</div>
          <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginTop: '0.25rem' }}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── CHARTS ──────────────────────────────────────────────────────────────────
function Charts({ stats }) {
  const barData = [
    { name: 'Source ANY', value: stats.any_source },
    { name: 'Dest ANY', value: stats.any_destination },
    { name: 'App ANY', value: stats.any_application },
  ]
  const pieData = [
    { name: 'ALLOW', value: stats.allow },
    { name: 'DENY', value: stats.deny },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">⚠️ Reguły z wartością ANY</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}>
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
            <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">📊 Akcje reguł</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}>
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── RULES TABLE ─────────────────────────────────────────────────────────────
function RulesTable({ rules }) {
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [filterAny, setFilterAny] = useState(false)
  const [filterOrigin, setFilterOrigin] = useState('all')

  const filtered = rules.filter(rule => {
    const matchSearch = rule.name?.toLowerCase().includes(search.toLowerCase()) ||
      rule.from?.join(' ').toLowerCase().includes(search.toLowerCase()) ||
      rule.to?.join(' ').toLowerCase().includes(search.toLowerCase()) ||
      rule.source?.join(' ').toLowerCase().includes(search.toLowerCase()) ||
      rule.destination?.join(' ').toLowerCase().includes(search.toLowerCase())
    const matchAction = filterAction === 'all' || rule.action === filterAction
    const matchOrigin = filterOrigin === 'all' || rule.origin === filterOrigin
    const matchAny = !filterAny || (
      rule.source?.includes('any') ||
      rule.destination?.includes('any') ||
      rule.application?.includes('any')
    )
    return matchSearch && matchAction && matchOrigin && matchAny
  })

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-8 overflow-x-auto">
      <h3 className="text-white font-semibold mb-4">📋 Lista reguł firewall</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="🔍 Szukaj reguły..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-blue-500 w-64" />
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-blue-500">
          <option value="all">Wszystkie akcje</option>
          <option value="allow">ALLOW</option>
          <option value="deny">DENY</option>
        </select>
        <select value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-blue-500">
          <option value="all">Wszystkie źródła</option>
          <option value="local">Lokalne</option>
          <option value="panorama">Panorama</option>
        </select>
        <button onClick={() => setFilterAny(!filterAny)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterAny ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
          ⚠️ Tylko reguły z ANY
        </button>
        <span className="text-gray-500 text-sm self-center">
          Pokazuje: {filtered.length} / {rules.length} reguł
        </span>
      </div>
      <table className="w-full text-sm text-gray-300">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="text-left py-2 px-3">Nazwa</th>
            <th className="text-left py-2 px-3">From</th>
            <th className="text-left py-2 px-3">To</th>
            <th className="text-left py-2 px-3">Source</th>
            <th className="text-left py-2 px-3">Destination</th>
            <th className="text-left py-2 px-3">Aplikacja</th>
            <th className="text-left py-2 px-3">Akcja</th>
            <th className="text-left py-2 px-3">Źródło</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-8 text-gray-500">Brak reguł spełniających kryteria</td>
            </tr>
          ) : filtered.map((rule, i) => (
            <tr key={i} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
              <td className="py-2 px-3 font-medium text-white">{rule.name}</td>
              <td className="py-2 px-3">{rule.from?.join(', ')}</td>
              <td className="py-2 px-3">{rule.to?.join(', ')}</td>
              <td className={`py-2 px-3 ${rule.source?.includes('any') ? 'text-red-400 font-bold' : ''}`}>{rule.source?.join(', ')}</td>
              <td className={`py-2 px-3 ${rule.destination?.includes('any') ? 'text-red-400 font-bold' : ''}`}>{rule.destination?.join(', ')}</td>
              <td className={`py-2 px-3 ${rule.application?.includes('any') ? 'text-orange-400 font-bold' : ''}`}>{rule.application?.join(', ')}</td>
              <td className="py-2 px-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${rule.action === 'allow' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                  {rule.action?.toUpperCase()}
                </span>
              </td>
              <td className="py-2 px-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${rule.origin === 'panorama' ? 'bg-purple-800 text-purple-200' : 'bg-blue-800 text-blue-200'}`}>
                  {rule.origin === 'panorama' ? '🌐 Panorama' : '💻 Lokalna'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── REPORT VIEW ─────────────────────────────────────────────────────────────
function ReportView({ data }) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 text-gray-200 leading-relaxed">
      <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
        📅 {data.timestamp} &nbsp;|&nbsp; 📋 Reguł: {data.rules_count}
      </div>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ color: '#60a5fa', fontSize: '1.25rem', fontWeight: 'bold', margin: '1.5rem 0 0.5rem' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ color: '#f97316', fontSize: '1.1rem', fontWeight: 'bold', margin: '1rem 0 0.25rem' }}>{children}</h3>,
          strong: ({ children }) => <strong style={{ color: '#fbbf24' }}>{children}</strong>,
          li: ({ children }) => <li style={{ marginLeft: '1.5rem', listStyleType: 'disc', marginBottom: '0.25rem' }}>{children}</li>,
          p: ({ children }) => <p style={{ marginBottom: '0.75rem' }}>{children}</p>,
          hr: () => <hr style={{ borderColor: '#374151', margin: '1rem 0' }} />,
        }}>
        {data.report}
      </ReactMarkdown>
    </div>
  )
}

// ─── HISTORY VIEW ────────────────────────────────────────────────────────────
function HistoryView({ history, onLoad, selectedAudit }) {
  const scoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-white font-semibold mb-4">📁 Historia audytów</h3>
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Brak zapisanych audytów. Uruchom pierwszy audyt!</p>
        ) : (
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-3">Data</th>
                <th className="text-left py-2 px-3">Reguł</th>
                <th className="text-left py-2 px-3">Score</th>
                <th className="text-left py-2 px-3">Ocena</th>
                <th className="text-left py-2 px-3">Krytyczne</th>
                <th className="text-left py-2 px-3">Wysokie</th>
                <th className="text-left py-2 px-3">Średnie</th>
                <th className="text-left py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {history.map((a) => (
                <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-2 px-3">{a.timestamp}</td>
                  <td className="py-2 px-3">{a.rules_count}</td>
                  <td className={`py-2 px-3 font-bold text-lg ${scoreColor(a.score)}`}>{a.score}</td>
                  <td className="py-2 px-3">{a.grade}</td>
                  <td className="py-2 px-3 text-red-400 font-bold">{a.critical}</td>
                  <td className="py-2 px-3 text-orange-400 font-bold">{a.high}</td>
                  <td className="py-2 px-3 text-yellow-400 font-bold">{a.medium}</td>
                  <td className="py-2 px-3">
                    <button onClick={() => onLoad(a.id)}
                      className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">
                      Zobacz raport
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedAudit && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">
            📄 Raport z {selectedAudit.timestamp} — Score:{' '}
            <span className={scoreColor(selectedAudit.score)}>{selectedAudit.score}/100</span>
          </h3>
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ color: '#60a5fa', fontSize: '1.25rem', fontWeight: 'bold', margin: '1.5rem 0 0.5rem' }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ color: '#f97316', fontSize: '1.1rem', fontWeight: 'bold', margin: '1rem 0 0.25rem' }}>{children}</h3>,
              strong: ({ children }) => <strong style={{ color: '#fbbf24' }}>{children}</strong>,
              li: ({ children }) => <li style={{ marginLeft: '1.5rem', listStyleType: 'disc', marginBottom: '0.25rem' }}>{children}</li>,
              p: ({ children }) => <p style={{ marginBottom: '0.75rem' }}>{children}</p>,
              hr: () => <hr style={{ borderColor: '#374151', margin: '1rem 0' }} />,
            }}>
            {selectedAudit.report}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [report, setReport] = useState(null)
  const [stats, setStats] = useState(null)
  const [rules, setRules] = useState([])
  const [scoreData, setScoreData] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const reportRef = useRef()

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/audits`)
      setHistory(res.data)
    } catch {}
  }

  const loadAudit = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/audits/${id}`)
      setSelectedAudit(res.data)
    } catch {}
  }

  useEffect(() => {
    axios.get(`${API_URL}/rules/stats`).then(r => setStats(r.data)).catch(() => {})
    axios.get(`${API_URL}/rules`).then(r => setRules(r.data.rules)).catch(() => {})
    axios.get(`${API_URL}/score`).then(r => setScoreData(r.data)).catch(() => {})
    loadHistory()
  }, [])

  const runAudit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_URL}/audit`)
      setReport(res.data)
      setScoreData(res.data.score)
      setActiveTab('report')
      loadHistory()
    } catch {
      setError('Błąd połączenia z API. Sprawdź czy backend działa.')
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = async () => {
    const element = reportRef.current
    const canvas = await html2canvas(element, { backgroundColor: '#030712', scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`firewall-audit-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'score', label: '🛡️ Security Score' },
    { id: 'rules', label: '📋 Reguły' },
    { id: 'report', label: '🤖 Raport AI' },
    { id: 'history', label: '📁 Historia' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">🔥 Firewall Auditor</h1>
            <p className="text-gray-400">Analiza reguł Palo Alto przy użyciu AI</p>
          </div>
          <div className="flex gap-3">
            {report && (
              <button onClick={exportPDF}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                📄 Eksport PDF
              </button>
            )}
            <button onClick={runAudit} disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors">
              {loading ? '⏳ Analizuję...' : '🔍 Uruchom Audyt'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🤖</div>
            <p>AI analizuje reguły firewall...</p>
            <p className="text-sm mt-2">To może potrwać kilkanaście sekund</p>
          </div>
        )}

        {!loading && (
          <div ref={reportRef}>
            {activeTab === 'dashboard' && stats && (
              <>
                <StatsCards stats={stats} />
                <Charts stats={stats} />
              </>
            )}

            {activeTab === 'score' && scoreData && <ScoreView data={scoreData} />}
            {activeTab === 'score' && !scoreData && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-4">🛡️</div>
                <p>Ładowanie Security Score...</p>
              </div>
            )}

            {activeTab === 'rules' && <RulesTable rules={rules} />}

            {activeTab === 'report' && report && <ReportView data={report} />}
            {activeTab === 'report' && !report && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-4">🤖</div>
                <p>Kliknij "Uruchom Audyt" aby wygenerować raport AI</p>
              </div>
            )}

            {activeTab === 'history' && (
              <HistoryView history={history} onLoad={loadAudit} selectedAudit={selectedAudit} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
