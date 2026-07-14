import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { Check, XCircle, ArrowRight, Volume2, RotateCcw, Settings2 } from 'lucide-react'
import { getSubjectsForUser, getWordsBySubject, updateProgress, Word, getDailyLimit, setDailyLimit, getStudiedToday, markStudiedToday, getRemainingToday } from '@/lib/localData'
import { speakWord } from '@/lib/pronunciation'

interface Subject {
  id: number
  name: string
}

export default function Learn() {
  const { user } = useAuthStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [allWords, setAllWords] = useState<Word[]>([])
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unknownWords, setUnknownWords] = useState<Word[]>([])
  const [round, setRound] = useState(1)
  const [showingResult, setShowingResult] = useState(false)
  const [dailyLimit, setDailyLimitState] = useState(0)
  const [showLimitInput, setShowLimitInput] = useState(false)
  const [studiedToday, setStudiedToday] = useState(0)
  const [dailyDone, setDailyDone] = useState(false)

  useEffect(() => {
    if (!user) return
    const subs = getSubjectsForUser(user.id).map(s => ({ id: s.id, name: s.name }))
    setSubjects(subs)
  }, [user])

  const fetchWords = useCallback((subjectId: string) => {
    setLoading(true)
    try {
      const data = getWordsBySubject(Number(subjectId))
      const limit = getDailyLimit(Number(subjectId))
      const studied = getStudiedToday(Number(subjectId))
      const remaining = getRemainingToday(Number(subjectId), data.length)

      setAllWords(data)
      setDailyLimitState(limit)
      setStudiedToday(studied.length)

      if (limit > 0 && remaining === 0) {
        // 今日配额已用完
        setWords([])
        setDailyDone(true)
        setDone(false)
      } else {
        setDailyDone(false)
        // 随机打乱，取今日剩余配额
        const shuffled = [...data].sort(() => Math.random() - 0.5)
        const quota = limit > 0 ? shuffled.slice(0, limit) : shuffled
        setWords(quota)
      }

      setCurrentIndex(0)
      setFlipped(false)
      setDone(false)
      setUnknownWords([])
      setRound(1)
      setShowingResult(false)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedSubject) fetchWords(selectedSubject)
  }, [selectedSubject, fetchWords])

  const handleKnown = () => {
    if (user && words[currentIndex]) {
      updateProgress(user.id, words[currentIndex].id, 'known')
      markStudiedToday(Number(selectedSubject), words[currentIndex].id)
    }
    setStudiedToday(prev => prev + 1)
    advanceToNext()
  }

  const handleUnknown = () => {
    if (user && words[currentIndex]) {
      updateProgress(user.id, words[currentIndex].id, 'unknown')
      markStudiedToday(Number(selectedSubject), words[currentIndex].id)
    }
    setFlipped(true)
    setShowingResult(true)
    setUnknownWords(prev => [...prev, words[currentIndex]])
    setStudiedToday(prev => prev + 1)
  }

  const advanceToNext = () => {
    if (currentIndex + 1 < words.length) {
      setFlipped(false)
      setShowingResult(false)
      setTimeout(() => setCurrentIndex(i => i + 1), 200)
    } else {
      if (unknownWords.length > 0) {
        setWords(unknownWords)
        setUnknownWords([])
        setCurrentIndex(0)
        setFlipped(false)
        setShowingResult(false)
        setRound(r => r + 1)
      } else {
        setDone(true)
      }
    }
  }

  const handleSetLimit = (limit: number) => {
    setDailyLimit(Number(selectedSubject), limit)
    setDailyLimitState(limit)
    setShowLimitInput(false)
    fetchWords(selectedSubject)
  }

  const current = words[currentIndex]
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>单词学习</h1>
        <p className="text-slate-400 text-sm mt-1">认识直接跳过，不认识翻转查看释义</p>
      </div>

      {/* Subject selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs text-slate-400">选择学科：</label>
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
        >
          <option value="" className="bg-[#0f1923]">请选择学科</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id} className="bg-[#0f1923]">{s.name}</option>
          ))}
        </select>
      </div>

      {/* Daily limit setting */}
      {selectedSubject && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLimitInput(!showLimitInput)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            每日数量
          </button>
          {dailyLimit > 0 && (
            <span className="text-xs text-cyan-400">
              今日 {studiedToday}/{dailyLimit}
              {dailyLimit > 0 && studiedToday >= dailyLimit ? ' · 已完成' : ''}
            </span>
          )}
          {dailyLimit === 0 && (
            <span className="text-xs text-slate-500">不限 · 共 {allWords.length} 个</span>
          )}

          <AnimatePresence>
            {showLimitInput && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5"
              >
                <input
                  type="number"
                  min={0}
                  max={allWords.length}
                  defaultValue={dailyLimit || ''}
                  placeholder="不限"
                  className="w-16 bg-transparent text-sm text-white text-center focus:outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = parseInt((e.target as HTMLInputElement).value) || 0
                      handleSetLimit(val)
                    }
                  }}
                />
                <span className="text-xs text-slate-500">个/天</span>
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="number"]') as HTMLInputElement
                    const val = parseInt(input?.value) || 0
                    handleSetLimit(val)
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  确定
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {loading && <p className="text-center text-slate-400 py-8">加载中...</p>}

      {!selectedSubject && !loading && (
        <p className="text-center text-slate-500 py-12">请选择一个学科开始学习</p>
      )}

      {selectedSubject && !loading && words.length === 0 && !done && !dailyDone && (
        <p className="text-center text-slate-500 py-12">该学科暂无单词</p>
      )}

      {dailyDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">今日任务完成！</h3>
          <p className="text-slate-400 text-sm">
            已学完今日 {dailyLimit} 个单词，明天继续
          </p>
          <button
            onClick={() => { fetchWords(selectedSubject) }}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl transition-colors"
          >
            再学一些
          </button>
        </motion.div>
      )}

      {done && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">全部掌握！</h3>
          <p className="text-slate-400 text-sm">
            你已掌握 {allWords.length} 个单词{round > 1 ? `，共学习 ${round} 轮` : ''}
          </p>
          <button
            onClick={() => { fetchWords(selectedSubject) }}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl transition-colors"
          >
            再学一遍
          </button>
        </motion.div>
      )}

      {current && !done && !loading && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                第 {round} 轮 · {currentIndex + 1}/{words.length}
              </span>
              {round > 1 && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  复习不认识的单词
                </span>
              )}
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Word card */}
          <div className="relative w-full h-72 rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#0f1d33] border border-white/[0.08] flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              {!flipped ? (
                <motion.div
                  key="front"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <p className="text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>{current.english}</p>
                  <div className="flex items-center gap-2">
                    {current.phonetic && <span className="text-sm text-slate-400">{current.phonetic}</span>}
                    <button onClick={(e) => { e.stopPropagation(); speakWord(current.english) }} className="text-slate-500 hover:text-blue-400 transition-colors" title="朗读发音">
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-6"
                >
                  <p className="text-2xl font-bold text-white mb-2">{current.chinese}</p>
                  <p className="text-sm text-slate-400 text-center leading-relaxed">{current.definition}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            {showingResult ? (
              <button
                onClick={advanceToNext}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                <ArrowRight className="w-5 h-5" /> 下一个
              </button>
            ) : (
              <>
                <button
                  onClick={handleUnknown}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors"
                >
                  <XCircle className="w-5 h-5" /> 不认识
                </button>
                <button
                  onClick={handleKnown}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-colors"
                >
                  <Check className="w-5 h-5" /> 认识
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}