import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Search as SearchIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { searchWords as searchLocalWords } from '@/lib/localData'

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => { fn(...args); timer = undefined as any }, ms)
  }
  debounced.cancel = () => clearTimeout(timer)
  return debounced
}

interface Word {
  id: number
  english: string
  chinese: string
  definition: string
  phonetic: string
  root: string
  rootMeaning: string
  example: string
  exampleTranslation: string
  subjectName: string
}

export default function Search() {
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [relatedRoot, setRelatedRoot] = useState<string | null>(null)

  const debouncedSearch = useMemo(() =>
    debounce((q: string) => {
      if (!q.trim()) {
        setResults([])
        setLoading(false)
        return
      }
      try {
        const data = searchLocalWords(q)
        setResults(data)
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 300)
  , [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debouncedSearch(query)
    return () => debouncedSearch.cancel()
  }, [query, debouncedSearch])

  const highlightMatch = (text: string, q: string) => {
    if (!q) return text
    const regex = new RegExp(`(${q})`, 'gi')
    const parts = text.split(regex)
    return parts.map((p, i) =>
      p.toLowerCase() === q.toLowerCase() ?
        <span key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">{p}</span> : p
    )
  }

  const filteredResults = relatedRoot
    ? results.filter(w => w.root === relatedRoot)
    : results

  const uniqueRoots = useMemo(() => {
    const roots = new Set<string>()
    results.forEach(w => w.root && roots.add(w.root))
    return Array.from(roots)
  }, [results])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>单词搜索</h1>
        <p className="text-slate-400 text-sm mt-1">查找医学术语，查看详情</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="输入英文单词或中文术语..."
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
        />
      </div>

      {uniqueRoots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 py-1 px-2">词根：</span>
          {uniqueRoots.map(root => (
            <button
              key={root}
              onClick={() => setRelatedRoot(relatedRoot === root ? null : root)}
              className={`px-2 py-1 text-xs rounded-full border transition-colors
                ${relatedRoot === root ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.15]'}`}
            >
              {root}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-center text-slate-500 py-8">搜索中...</p>}

      {!loading && query && filteredResults.length === 0 && (
        <p className="text-center text-slate-500 py-12">未找到匹配的单词</p>
      )}

      <div className="space-y-3">
        {filteredResults.map(word => {
          const expanded = expandedId === word.id
          return (
            <div
              key={word.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors"
            >
              <button
                onClick={() => setExpandedId(expanded ? null : word.id)}
                className="w-full text-left p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white">
                      {highlightMatch(word.english, query)}
                    </h3>
                    {word.phonetic && <span className="text-xs text-slate-500">{word.phonetic}</span>}
                  </div>
                  <p className="text-sm text-slate-300 mt-1">
                    {highlightMatch(word.chinese, query)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded">
                      {word.subjectName}
                    </span>
                    {word.root && (
                      <span className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">
                        词根: {word.root}
                      </span>
                    )}
                  </div>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
              </button>

              {expanded && (
                <div className="px-4 pb-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">释义</p>
                    <p className="text-slate-300 text-sm">{word.definition}</p>
                  </div>
                  {word.root && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">词根分析</p>
                      <p className="text-slate-300 text-sm">{word.root} - {word.rootMeaning}</p>
                    </div>
                  )}
                  {word.example && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">文献例句</p>
                      <p className="text-slate-400 italic text-sm">{word.example}</p>
                      {word.exampleTranslation && <p className="text-slate-500 text-xs mt-1">{word.exampleTranslation}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!query && !loading && (
        <p className="text-center text-slate-500 py-12">输入关键词开始搜索</p>
      )}
    </div>
  )
}