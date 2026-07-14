import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Trophy, Target, BookOpen } from 'lucide-react'

interface SubjectStat {
  name: string
  mastered: number
  total: number
}

interface DailyStat {
  date: string
  count: number
}

interface Overview {
  total: number
  mastered: number
  rate: number
  trend: { date: string; words: number }[]
}

const weekDays = ['一', '二', '三', '四', '五', '六', '日']
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function ContributionGraph({ data }: { data: { date: string; count: number }[] }) {
  // Last 3 months
  const today = new Date()
  const grid: { date: Date; count: number }[][] = []
  let week: (typeof grid)[0][number][] = []

  const start = new Date(today)
  start.setDate(today.getDate() - 90)
  const startDay = start.getDay() || 7 // 1 is Mon -> 0 for 1=Monday

  for (let i = 1; i < startDay; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() - (startDay - i))
    const count = data.find(x => x.date === d.toISOString().slice(0, 10))?.count || 0
    week.push({ date: d, count })
  }

  let current = new Date(start)
  while (current <= today) {
    if (week.length === 7) {
      grid.push(week)
      week = []
    }
    const count = data.find(x => x.date === current.toISOString().slice(0, 10))?.count || 0
    week.push({ date: current, count })
    current = new Date(current)
    current.setDate(current.getDate() + 1)
  }
  while (week.length < 7 && week.length > 0) {
    const d = new Date(week[week.length - 1].date)
    d.setDate(d.getDate() + 1)
    week.push({ date: d, count: 0 })
  }
  if (week.length === 7) grid.push(week)

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.04)'
    if (count < 5) return 'rgba(59, 130, 246, 0.3)'
    if (count < 15) return 'rgba(59, 130, 246, 0.6)'
    return 'rgba(59, 130, 246, 0.9)'
  }

  return (
    <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
      <h3 className="text-sm font-medium text-white mb-4">学习日历</h3>
      <div className="flex gap-1 mb-1">
        <div className="w-4" />
        {weekDays.map(d => (
          <div key={d} className="w-3 h-3 flex items-center justify-center">
            <span className="text-[10px] text-slate-500">{d}</span>
          </div>
        ))}
      </div>
      {grid.map((week, i) => (
        <div key={i} className="flex gap-1 mb-1">
          <div className="w-4 flex items-center">
            {week[0].date.getDate() === 1 && (
              <span className="text-[10px] text-slate-500">{months[week[0].date.getMonth()]}</span>
            )}
          </div>
          {week.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getColor(cell.count) }}
              title={`${cell.date.toLocaleDateString()}: ${cell.count} words`}
            />
          ))}
        </div>
      ))}
      <div className="flex items-center justify-end gap-2 mt-2">
        <span className="text-[10px] text-slate-500">少</span>
        <div className="flex gap-1">
          {[0, 4, 10, 20].map(c => (
            <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(Math.max(c, 0)) }} />
          ))}
        </div>
        <span className="text-[10px] text-slate-500">多</span>
      </div>
    </div>
  )
}

export default function Stats() {
  const { token } = useAuthStore()
  const [overview, setOverview] = useState<Overview>({ total: 0, mastered: 0, rate: 0, trend: [] })
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([])
  const [daily, setDaily] = useState<DailyStat[]>([])

  useEffect(() => {
    ;(async () => {
      const [oRes, sRes, dRes] = await Promise.all([
        fetch('/api/stats/overview', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/stats/subjects', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/stats/daily', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const [oData, sData, dData] = await Promise.all([
        oRes.json(),
        sRes.json(),
        dRes.json(),
      ])
      if (oData.success) setOverview(oData.data)
      if (sData.success) setSubjectStats(sData.data)
      if (dData.success) setDaily(dData.data)
    })().catch(() => {})
  }, [token])

  const chartData = subjectStats.map(s => ({
    name: s.name.length > 6 ? s.name.slice(0, 6) + '...' : s.name,
    rate: s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0,
  }))

  const trendData = overview.trend.map(t => ({
    label: t.date.slice(-5),
    words: t.words,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>学习统计</h1>
        <p className="text-slate-400 text-sm mt-1">查看你的学习进度和数据</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: '总单词数', value: overview.total, icon: BookOpen, color: 'from-blue-500/20 to-blue-600/20', text: 'text-blue-400' },
          { label: '已掌握', value: overview.mastered, icon: Trophy, color: 'from-emerald-500/20 to-emerald-600/20', text: 'text-emerald-400' },
          { label: '掌握率', value: `${Math.round(overview.rate * 100)}%`, icon: Target, color: 'from-orange-500/20 to-orange-600/20', text: 'text-orange-400' },
        ].map(card => (
          <div key={card.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.text}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">学科掌握率</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1b2a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Bar dataKey="rate" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">最近学习趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1b2a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="words" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ContributionGraph data={daily} />
    </div>
  )
}