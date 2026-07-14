import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { Plus, Library, X, Trash2, BookOpen, PlusCircle, Stethoscope, Microscope } from 'lucide-react'

interface Subject {
  id: string
  name: string
  wordCount: number
  isPreset: boolean
}

interface Word {
  id: string
  english: string
  chinese: string
  phonetic: string
  definition: string
  example: string
  exampleTranslation: string
  root: string
  rootMeaning: string
}

const presetIcons = [BookOpen, Library, Stethoscope, Microscope]

export default function Subjects() {
  const { token } = useAuthStore()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [words, setWords] = useState<Word[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addWordModalOpen, setAddWordModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [newSubjectName, setNewSubjectName] = useState('')
  const [newWord, setNewWord] = useState<Partial<Word>>({
    english: '', chinese: '', phonetic: '', definition: '', example: '', exampleTranslation: '', root: '', rootMeaning: '',
  })

  const loadSubjects = async () => {
    const res = await fetch('/api/subjects', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (data.success) setSubjects(data.data)
  }

  useEffect(() => {
    loadSubjects()
  }, [token])

  const loadWords = async (subject: Subject) => {
    setSelectedSubject(subject)
    const res = await fetch(`/api/words/list?subjectId=${subject.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.success) setWords(data.data)
  }

  const addSubject = async () => {
    if (!newSubjectName.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/subjects/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newSubjectName }),
      })
      const data = await res.json()
      if (data.success) {
        await loadSubjects()
        setNewSubjectName('')
        setAddModalOpen(false)
      }
    } catch {}
    setLoading(false)
  }

  const deleteSubject = async (id: string) => {
    if (!confirm('确定删除该学科？所有单词也会被删除。')) return
    try {
      await fetch(`/api/subjects/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      await loadSubjects()
      if (selectedSubject?.id === id) setSelectedSubject(null)
    } catch {}
  }

  const addWord = async () => {
    if (!selectedSubject || !newWord.english || !newWord.chinese) return
    setLoading(true)
    try {
      const res = await fetch('/api/words/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newWord, subjectId: selectedSubject.id }),
      })
      const data = await res.json()
      if (data.success) {
        setWords([...words, data.data])
        setNewWord({
          english: '', chinese: '', phonetic: '', definition: '', example: '', exampleTranslation: '', root: '', rootMeaning: '',
        })
        setAddWordModalOpen(false)
      }
    } catch {}
    setLoading(false)
  }

  const deleteWord = async (id: string) => {
    if (!confirm('确定删除这个单词？')) return
    try {
      await fetch(`/api/words/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setWords(words.filter(w => w.id !== id))
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>学科管理</h1>
        <p className="text-slate-400 text-sm mt-1">管理学习分类和单词</p>
      </div>

      {/* Subject grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {subjects.map(subject => {
          const Icon = presetIcons[subject.id.charCodeAt(0) % presetIcons.length]
          return (
            <div
              key={subject.id}
              className={`relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 cursor-pointer hover:border-blue-500/40 transition-all
                ${selectedSubject?.id === subject.id ? 'border-blue-500/50 bg-blue-500/10' : ''}`}
              onClick={() => loadWords(subject)}
            >
              {!subject.isPreset && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id) }}
                  className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-medium text-white">{subject.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{subject.wordCount} 个单词</p>
            </div>
          )
        })}

        <button
          onClick={() => setAddModalOpen(true)}
          className="border-2 border-dashed border-white/[0.08] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-500/40 hover:text-blue-400 transition-colors"
        >
          <PlusCircle className="w-8 h-8" />
          <span className="text-xs">添加学科</span>
        </button>
      </div>

      {/* Word list */}
      {selectedSubject && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-white">{selectedSubject.name} · 单词列表</h3>
              <p className="text-xs text-slate-500">{words.length} 个单词</p>
            </div>
            <button
              onClick={() => setAddWordModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> 添加单词
            </button>
          </div>

          {words.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">该学科暂无单词，点击上方添加</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {words.map(word => (
                <div key={word.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{word.english}</p>
                    <p className="text-xs text-slate-400 truncate">{word.chinese}</p>
                    {word.phonetic && <p className="text-[10px] text-slate-600">{word.phonetic}</p>}
                  </div>
                  <button
                    onClick={() => deleteWord(word.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Subject Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d1b2a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-white">添加学科</h3>
                <button onClick={() => setAddModalOpen(false)} className="text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">学科名称</label>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    placeholder="例如：解剖学"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <button
                  onClick={addSubject}
                  disabled={loading || !newSubjectName.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-xl"
                >
                  {loading ? '添加中...' : '创建'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Word Modal */}
      <AnimatePresence>
        {addWordModalOpen && selectedSubject && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAddWordModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d1b2a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-white">添加单词</h3>
                <button onClick={() => setAddWordModalOpen(false)} className="text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">英文*</label>
                    <input
                      value={newWord.english}
                      onChange={e => setNewWord({ ...newWord, english: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">中文*</label>
                    <input
                      value={newWord.chinese}
                      onChange={e => setNewWord({ ...newWord, chinese: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">音标</label>
                  <input
                    value={newWord.phonetic}
                    onChange={e => setNewWord({ ...newWord, phonetic: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="/ˌæpəˈdætəs/"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">释义</label>
                  <textarea
                    value={newWord.definition}
                    onChange={e => setNewWord({ ...newWord, definition: e.target.value })}
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">词根</label>
                    <input
                      value={newWord.root}
                      onChange={e => setNewWord({ ...newWord, root: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">词根含义</label>
                    <input
                      value={newWord.rootMeaning}
                      onChange={e => setNewWord({ ...newWord, rootMeaning: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">医学例句</label>
                  <textarea
                    value={newWord.example}
                    onChange={e => setNewWord({ ...newWord, example: e.target.value })}
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">例句翻译</label>
                  <input
                    value={newWord.exampleTranslation}
                    onChange={e => setNewWord({ ...newWord, exampleTranslation: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <button
                  onClick={addWord}
                  disabled={loading || !newWord.english || !newWord.chinese}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-xl mt-2"
                >
                  {loading ? '添加中...' : '添加单词'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}