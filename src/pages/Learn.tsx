import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { Check, XCircle, ChevronDown, ChevronUp, Volume2 } from 'lucide-react'
import { getSubjectsForUser, getWordsBySubject, updateProgress, Word } from '@/lib/localData'

interface Subject {
  id: number
  name: string
}

export default function Learn() {
  const { user } = useAuthStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showExample, setShowExample] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const subs = getSubjectsForUser(user.id).map(s => ({ id: s.id, name: s.name }))
    setSubjects(subs)
  }, [user])

  const fetchWords = useCallback((subjectId: string) => {
    setLoading(true)
    try {
      const data = getWordsBySubject(Number(subjectId))
      setWords(data)
      setCurrentIndex(0)
      setFlipped(false)
      setShowExample(false)
      setDone(false)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedSubject) fetchWords(selectedSubject)
  }, [selectedSubject, fetchWords])

  const handleResponse = (known: boolean) => {
    if (user && words[currentIndex]) {
      updateProgress(user.id, words[currentIndex].id, known ? 'known' : 'unknown')
    }
    if (currentIndex + 1 < words.length) {
      setFlipped(false)
      setShowExample(false)
      setTimeout(() => setCurrentIndex(i => i + 1), 200)
    } else {
      setDone(true)
    }
  }

  const current = words[currentIndex]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>单词学习</h1>
        <p className="text-slate-400 text-sm mt-1">翻转卡片，记忆单词</p>
      </div>

      {/* Subject selector */}
      <div className="flex items-center gap-3">
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

      {loading && <p className="text-center text-slate-400 py-8">加载中...</p>}

      {!selectedSubject && !loading && (
        <p className="text-center text-slate-500 py-12">请选择一个学科开始学习</p>
      )}

      {selectedSubject && !loading && words.length === 0 && !done && (
        <p className="text-center text-slate-500 py-12">该学科暂无单词</p>
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
          <h3 className="text-xl font-bold text-white mb-2">学习完成！</h3>
          <p className="text-slate-400 text-sm">你已完成 {words.length} 个单词的学习</p>
          <button
            onClick={() => { setCurrentIndex(0); setFlipped(false); setShowExample(false); setDone(false) }}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl transition-colors"
          >
            再学一遍
          </button>
        </motion.div>
      )}

      {current && !done && !loading && (
        <>
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{currentIndex + 1}/{words.length}</span>
          </div>

          {/* Word card */}
          <div
            className="cursor-pointer"
            style={{ perspective: '1200px' }}
            onClick={() => setFlipped(!flipped)}
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
              className="w-full h-72 rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#0f1d33] border border-white/[0.08] flex items-center justify-center relative overflow-hidden"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
                <p className="text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>{current.english}</p>
                {current.phonetic && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">{current.phonetic}</span>
                    <button onClick={(e) => { e.stopPropagation(); /* speak */ }} className="text-slate-500 hover:text-blue-400">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-600 mt-4">点击翻转</p>
              </div>
              {/* Back */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <p className="text-2xl font-bold text-white mb-2">{current.chinese}</p>
                <p className="text-sm text-slate-400 text-center leading-relaxed mb-4">{current.definition}</p>
                {current.example && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowExample(!showExample) }}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    例句 {showExample ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
                <AnimatePresence>
                  {showExample && current.example && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-2"
                    >
                      <p className="text-xs text-slate-400 italic">"{current.example}"</p>
                      {current.exampleTranslation && (
                        <p className="text-xs text-slate-500 mt-1">{current.exampleTranslation}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => handleResponse(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors"
            >
              <XCircle className="w-5 h-5" /> 不认识
            </button>
            <button
              onClick={() => handleResponse(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-colors"
            >
              <Check className="w-5 h-5" /> 认识
            </button>
          </div>
        </>
      )}
    </div>
  )
}