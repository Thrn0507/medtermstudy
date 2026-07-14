import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { BookOpen, Brain, Flame, Play, Gamepad2, Search, Clock } from 'lucide-react'
import ReviewModal from '@/components/ReviewModal'

interface Stats {
  todayNew: number
  mastered: number
  streak: number
  subjects: { name: string; progress: number; color: string }[]
  recentActivity: { word: string; subject: string; time: string; type: string }[]
}

const subjectColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function RingProgress({ progress, color, size = 80, strokeWidth = 6 }: { progress: number; color: string; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (progress / 100) * circumference
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-1000"
      />
    </svg>
  )
}

export default function Home() {
  const { token } = useAuthStore()
  const navigate = useNavigate()
  const [showReview, setShowReview] = useState(false)
  const [stats, setStats] = useState<Stats>({
    todayNew: 0, mastered: 0, streak: 0,
    subjects: [], recentActivity: [],
  })

  useEffect(() => {
    fetch('/api/stats/overview', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (d.success) setStats(d.data)
      }).catch(() => {})
  }, [token])

  useEffect(() => {
    const reviewed = localStorage.getItem('reviewed_today')
    const today = new Date().toDateString()
    if (reviewed !== today) {
      const timer = setTimeout(() => setShowReview(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>仪表盘</h1>
        <p className="text-slate-400 text-sm mt-1">欢迎回来，继续你的学习之旅</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: '今日待学', value: stats.todayNew, icon: BookOpen, color: 'from-blue-500/20 to-blue-600/20', iconColor: 'text-blue-400' },
          { label: '已掌握', value: stats.mastered, icon: Brain, color: 'from-emerald-500/20 to-emerald-600/20', iconColor: 'text-emerald-400' },
          { label: '连续学习', value: `${stats.streak}天`, icon: Flame, color: 'from-orange-500/20 to-orange-600/20', iconColor: 'text-orange-400' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm hover:border-white/[0.1] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                <motion.p
                  className="text-4xl font-bold text-white"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                >
                  {card.value}
                </motion.p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: '开始学习', desc: '学习新单词', icon: Play, to: '/learn', color: 'from-blue-600 to-blue-500' },
          { label: '消消乐', desc: '游戏化记忆', icon: Gamepad2, to: '/game', color: 'from-purple-600 to-purple-500' },
          { label: '搜索单词', desc: '查找术语', icon: Search, to: '/search', color: 'from-emerald-600 to-emerald-500' },
        ].map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            onClick={() => navigate(action.to)}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-left hover:border-white/[0.15] transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-medium text-white">{action.label}</h3>
            <p className="text-xs text-slate-500 mt-1">{action.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Subject progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">学科进度</h3>
          {stats.subjects.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">暂无数据</p>
          ) : (
            <div className="flex flex-wrap gap-6 justify-center">
              {stats.subjects.map((s, i) => (
                <div key={s.name} className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <RingProgress progress={s.progress} color={s.color || subjectColors[i % subjectColors.length]} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{Math.round(s.progress)}%</span>
                  </div>
                  <span className="text-xs text-slate-400">{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">最近学习</h3>
          {stats.recentActivity.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">暂无学习记录</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <Clock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  <span className="text-white font-medium">{a.word}</span>
                  <span className="text-slate-500">{a.subject}</span>
                  <span className="text-slate-600 ml-auto">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReviewModal open={showReview} onClose={() => { setShowReview(false); localStorage.setItem('reviewed_today', new Date().toDateString()) }} />
    </div>
  )
}