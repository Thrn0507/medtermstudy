import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { RotateCcw, Trophy, Timer } from 'lucide-react'

interface Card {
  id: string
  content: string
  matched: boolean
  type: 'en' | 'zh'
  wordId: string
}

interface Subject {
  id: string
  name: string
}

export default function Game() {
  const { token } = useAuthStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [flippedIds, setFlippedIds] = useState<string[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(true)
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => {
    fetch('/api/subjects', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setSubjects(d.data) }).catch(() => {})
  }, [token])

  const startGame = useCallback(async (subjectId: string) => {
    setSelectedSubject(subjectId)
    setLoading(true)
    try {
      const res = await fetch(`/api/game/words?subjectId=${subjectId}&count=8`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.data.length) {
        const gameCards: Card[] = []
        data.data.forEach((w: any, i: number) => {
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
        // Shuffle
        const shuffled = gameCards.sort(() => Math.random() - 0.5)
        setCards(shuffled)
        setFlippedIds([])
        setShowAll(true)
        setStartTime(Date.now())
        setElapsed(0)
        setMatchedCount(0)
        setGameOver(false)
        setTimeout(() => setShowAll(false), 2000)
      }
    } catch {}
    setLoading(false)
  }, [token])

  useEffect(() => {
    if (!startTime || gameOver) return
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime, gameOver])

  const checkComplete = () => {
    if (matchedCount * 2 === cards.length) {
      setGameOver(true)
    }
  }

  useEffect(() => {
    if (matchedCount > 0) checkComplete()
  }, [matchedCount])

  const canFlip = (card: Card) => {
    if (card.matched) return false
    if (flippedIds.length >= 2) return false
    if (flippedIds.includes(card.id)) return false
    return true
  }

  const flip = (card: Card) => {
    if (!canFlip(card)) return
    setFlippedIds([...flippedIds, card.id])
    if (flippedIds.length === 1) {
      const first = cards.find(c => c.id === flippedIds[0])
      if (!first) return
      if (first.wordId === card.wordId) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            (c.id === first.id || c.id === card.id) ? { ...c, matched: true } : c
          ))
          setMatchedCount(m => m + 1)
          setFlippedIds([])
        }, 600)
      } else {
        setTimeout(() => setFlippedIds([]), 1000)
      }
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const restart = () => {
    if (selectedSubject) startGame(selectedSubject)
  }

  const isFlipped = (id: string) => showAll || flippedIds.includes(id) || cards.find(c => c.id === id)?.matched

  if (!selectedSubject) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>单词消消乐</h1>
          <p className="text-slate-400 text-sm mt-1">配对英文和中文，边玩边记</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => startGame(s.id)}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 px-4 text-sm text-slate-200 hover:border-blue-500/40 hover:bg-white/[0.06] transition-colors"
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">单词消消乐</h1>
          <p className="text-xs text-slate-500">{subjects.find(s => s.id === selectedSubject)?.name}</p>
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

      <div className="grid grid-cols-4 gap-2">
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
            className={`aspect-square rounded-lg cursor-pointer perspective-800`}
            onClick={() => flip(card)}
          >
            <motion.div
              animate={{ rotateY: isFlipped(card.id) ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full relative preserve-3d"
            >
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-white/[0.08] rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-blue-200/80">?</span>
              </div>
              <div
                className="absolute inset-0 backface-hidden rotate-y-180 rounded-lg flex items-center justify-center p-1 bg-gradient-to-br from-[#0a1628] to-[#0f1d33] border border-white/[0.08]"
              >
                <span className={`text-center ${card.type === 'en' ? 'text-xs font-bold text-white' : 'text-[10px] text-slate-300'}`}>
                  {card.content}
                </span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500">
        已配对 {matchedCount}/8 对
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