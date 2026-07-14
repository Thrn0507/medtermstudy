import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Stethoscope, Mail, Lock, Eye, EyeOff, Dna } from 'lucide-react'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const { login, register, isAuthenticated, loading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/')
  }, [isAuthenticated, navigate])

  const validate = (): boolean => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址')
      return false
    }
    if (password.length < 6) {
      setError('密码长度至少6位')
      return false
    }
    if (isRegister && password !== confirmPassword) {
      setError('两次密码不一致')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const success = isRegister
      ? await register(email, password)
      : await login(email, password)
    if (!success) setError(isRegister ? '注册失败，请稍后重试' : '邮箱或密码错误')
    else navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#0f1923] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Hexagon bg pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='30,0 60,15 60,37 30,52 0,37 0,15' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 34px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(59,130,246,0.1)' }}
      >
        {/* Brand side */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#0a1628] to-[#0f1d33] flex-col items-center justify-center p-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${20 + (i % 3) * 25}%`,
                  top: `${10 + Math.floor(i / 3) * 35}%`,
                  transform: `rotate(${i * 15}deg)`,
                }}
              >
                <Dna className="w-20 h-20 text-blue-400" />
              </div>
            ))}
          </div>
          <motion.div
            className="relative z-10 text-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              MedTerm
            </h1>
            <p className="text-blue-300/80 text-sm">医学术语通</p>
            <p className="text-slate-400 text-xs mt-4 leading-relaxed">
              掌握医学英语术语<br />开启专业医学之旅
            </p>
          </motion.div>
        </div>

        {/* Form side */}
        <div className="w-full md:w-1/2 bg-[#0d1b2a]/90 backdrop-blur p-8 sm:p-10">
          <div className="md:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">MedTerm 医学术语通</h2>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {isRegister ? '创建账号' : '欢迎回来'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {isRegister ? '注册以开始学习' : '登录您的账号'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="至少6位"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <label className="text-xs text-slate-400 mb-1.5 block">确认密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium text-sm transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {loading ? '处理中...' : isRegister ? '注册' : '登录'}
            </button>
          </form>

          <p className="text-center mt-6 text-xs text-slate-500">
            {isRegister ? '已有账号？' : '没有账号？'}
            <button
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="text-blue-400 hover:text-blue-300 ml-1"
            >
              {isRegister ? '去登录' : '去注册'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}