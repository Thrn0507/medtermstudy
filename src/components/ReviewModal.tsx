import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { X, Check, XCircle } from 'lucide-react'

interface ReviewWord {
  id: string
  english: string
  chinese: string
  definition: string
}

export default function ReviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token } = useAuthStore()
  const [words, setWords] = useState<ReviewWord[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/review/today', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => {
          if (d.success && d.data?.length) {
            setWords(d.data)
            setIndex(0)
            setFlipped(false)
            setDone(false)
          } else {
            onClose()
          }
        }).catch(() => onClose())
    }
  }, [open, token, onClose])

  const handleResponse = async (known: boolean) => {
    if (words[index]) {
      fetch('/api/review/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ wordId: words[index].id, known }),
      }).catch(() => {})
    }
    if (index + 1 < words.length) {
      setFlipped(false)
      setTimeout(() => setIndex(i => i + 1), 150)
    } else {
      setDone(true)
    }
  }

  if (!open) return null

  const current = words[index]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative bg-[#0d1b2a] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>

          {done ? (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <h3 className="text-lg font-bold text-white mb-2">今日复习完成</h3>
              <p className="text-sm text-slate-400">你已复习了 {words.length} 个单词</p>
              <button onClick={onClose} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl transition-colors">
                关闭
              </button>
            </div>
          ) : current ? (
            <>
              <p className="text-xs text-slate-500 mb-4 text-center">
                每日复习 · {index + 1}/{words.length}
              </p>
              <div
                className="relative cursor-pointer mb-6"
                style={{ perspective: '1000px' }}
                onClick={() => setFlipped(!flipped)}
              >
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-48 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/[0.08] flex items-center justify-center"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {!flipped ? (
                    <div className="text-center" style={{ backfaceVisibility: 'hidden' }}>
                      <p className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>{current.english}</p>
                      <p className="text-xs text-slate-500">点击翻转查看释义</p>
                    </div>
                  ) : (
                    <div className="text-center px-4" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      <p className="text-xl font-bold text-white mb-2">{current.chinese}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{current.definition}</p>
                    </div>
                  )}
                </motion.div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleResponse(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm transition-colors"
                >
                  <XCircle className="w-4 h-4" /> 不认识
                </button>
                <button
                  onClick={() => handleResponse(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-sm transition-colors"
                >
                  <Check className="w-4 h-4" /> 认识
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-slate-400 py-8 text-sm">暂无需要复习的单词</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}