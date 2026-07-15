import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { RotateCcw, Trophy, Timer, Settings2 } from 'lucide-react'
import { getSubjectsForUser, getGameWords, Word } from '@/lib/localData'

interface Card {
  id: string
  content: string
  matched: boolean
  type: 'en' | 'zh'
  wordId: number
}

interface Subject {
  id: number
  name: string
}

const PAIR_OPTIONS = [4, 6, 8, 10, 12]

export default function Game() {
  const { user } = useAuthStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [pairCount, setPairCount] = useState(8)
  const [showPairPicker, setShowPairPicker] = useState(false)

  useEffect(() => {
    if (!user) return
    const subs = getSubjectsForUser(user.id).map(s => ({ id: s.id, name: s.name }))
    setSubjects(subs)
  }, [user])

  const startGame = useCallback((subjectId: string, count: number) => {
    setSelectedSubject(subjectId)
    setLoading(true)
    try {
      const data = getGameWords(Number(subjectId), count)
      if (data.length) {
        const gameCards: Card[] = []
        data.forEach((w: Word, i: number) => {
          gameCards.push({
            id: `${w.id}-en-${i}`,
            content: w.english,
            matched: false,
            type: 'en',
            wordId: w.id,
          })
          gameCards.push({
            id: `${w.id}-zh-${i}`,
            content: w.chinese,
            matched: false,
            type: 'zh',
            wordId: w.id,
          })
        })
        const shuffled = gameCards.sort(() => Math.random() - 0.5)
        setCards(shuffled)
        setSelectedIds([])
        setStartTime(Date.now())
        setElapsed(0)
        setMatchedCount(0)
        setGameOver(false)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!startTime || gameOver) return
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime, gameOver])

  useEffect(() => {
    if (matchedCount > 0 && matchedCount * 2 === cards.length) {
      setGameOver(true)
    }
  }, [matchedCount, cards.length])

  const selectCard = (card: Card) => {
    if (card.matched) return
    if (selectedIds.includes(card.id)) return

    const newSelected = [...selectedIds, card.id]
    setSelectedIds(newSelected)

    if (newSelected.length === 2) {
      const first = cards.find(c => c.id === newSelected[0])
      const second = card
      if (first && first.wordId === second.wordId) {
        // 匹配成功
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            (c.id === first.id || c.id === second.id) ? { ...c, matched: true } : c
          ))
          setMatchedCount(m => m + 1)
          setSelectedIds([])
        }, 400)
      } else {
        // 不匹配，短暂高亮后取消
        setTimeout(() => setSelectedIds([]), 600)
      }
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const restart = () => {
    if (selectedSubject) startGame(selectedSubject, pairCount)
  }

  const getGridCols = (count: number) => {
    const total = count * 2
    if (total <= 8) return 'grid-cols-4'
    if (total <= 16) return 'grid-cols-4'
    return 'grid-cols-5'
  }

  if (!selectedSubject) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-8 py-12">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>单词消消乐</h1>
          <p className="text-slate-400 text-sm mt-1">点击配对的英文和中文，全部消除即胜利</p>
        </div>

        {/* Pair count picker */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setShowPairPicker(!showPairPicker)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <Settings2 className="w-3.5 h-3.5" />
            配对数量：{pairCount} 对
          </button>
          <AnimatePresence>
            {showPairPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-2 py-1.5"
              >
                {PAIR_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => { setPairCount(n); setShowPairPicker(false) }}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                      pairCount === n ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/[0.06]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => startGame(String(s.id), pairCount)}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl py-4 px-5 text-base text-slate-200 hover:border-blue-500/40 hover:bg-white/[0.06] transition-colors"
            >
              {s.name}
            </button>
          ))}
        </div>

        {loading && <p className="text-slate-400 text-sm">加载中...</p>}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">单词消消乐</h1>
          <p className="text-xs text-slate-500">{subjects.find(s => String(s.id) === selectedSubject)?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Timer className="w-4 h-4" />
            {formatTime(elapsed)}
          </div>
          <button onClick={restart} className="p-2 text-slate-400 hover:text-white bg-white/[0.04] rounded-lg">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500">点击英文和中文配对，全部消除即胜利</p>

      <div className={`grid grid-cols-4 gap-3`}>
        {cards.map(card => (
          <motion.div
            key={card.id}
            layout
            initial={{ scale: 0 }}
            animate={{
              scale: card.matched ? 0 : 1,
              opacity: card.matched ? 0 : 1,
            }}
            transition={{ duration: 0.3 }}
            onClick={() => selectCard(card)}
            className={`aspect-square rounded-xl cursor-pointer flex items-center justify-center p-3 border transition-all duration-200 ${
              card.matched
                ? 'pointer-events-none'
                : selectedIds.includes(card.id)
                  ? 'border-blue-400 bg-blue-500/20 scale-105'
                  : 'border-white/[0.08] bg-[#0a1628] hover:border-blue-500/30'
            }`}
          >
            <span className={`text-center leading-tight ${
              card.type === 'en'
                ? 'text-sm font-bold text-white'
                : 'text-sm text-slate-300'
            }`}>
              {card.content}
            </span>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-sm text-slate-500">
        已配对 {matchedCount}/{cards.length / 2} 对
      </p>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          >
            <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">恭喜完成！</h3>
              <p className="text-sm text-slate-400 mb-4">用时 {formatTime(elapsed)}</p>
              <div className="space-y-2">
                <button
                  onClick={restart}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl transition-colors"
                >
                  再来一局
                </button>
                <button
                  onClick={() => setSelectedSubject('')}
                  className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-sm rounded-xl transition-colors"
                >
                  更换学科
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}