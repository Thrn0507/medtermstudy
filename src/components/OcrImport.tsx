import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, FileText, Loader2 } from 'lucide-react'
import { fetchPhoneticsBatch } from '@/lib/pronunciation'

interface TextImportResult {
  english: string
  chinese: string
  pronunciation: string
  definition: string
}

interface Props {
  onResult: (words: TextImportResult[]) => void
  onClose: () => void
}

export default function TextImport({ onResult, onClose }: Props) {
  const [text, setText] = useState('')
  const [results, setResults] = useState<TextImportResult[]>([])
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set())
  const [fetchingPhonetics, setFetchingPhonetics] = useState(false)
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const parseText = (input: string): TextImportResult[] => {
    const lines = input
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .filter(l => !l.startsWith('#') && !l.startsWith('//'))

    const pairs: TextImportResult[] = []
    let pending: { english: string; pronunciation: string } | null = null

    const splitChineseAndDef = (text: string): { chinese: string; definition: string } => {
      const pipeIdx = text.indexOf('|')
      if (pipeIdx > 0) {
        return {
          chinese: text.slice(0, pipeIdx).trim(),
          definition: text.slice(pipeIdx + 1).trim(),
        }
      }
      return { chinese: text, definition: '' }
    }

    const cleanChinese = (s: string) => s.replace(/[^a-zA-Z\u4e00-\u9fff\s|]/g, '').trim()

    for (const line of lines) {
      let pronunciation = ''
      let english = ''
      let chinese = ''
      let definition = ''

      const slashMatch = line.match(/^([a-zA-Z\s\-]+)\s+([\/\[]([^\]\/]+)[\/\]])\s+(.+)$/)
      if (slashMatch) {
        english = slashMatch[1].trim()
        pronunciation = slashMatch[2].trim()
        const cd = splitChineseAndDef(cleanChinese(slashMatch[4]))
        chinese = cd.chinese
        definition = cd.definition
        if (english.length > 1 && chinese.length > 0) {
          pairs.push({ english, chinese, pronunciation, definition })
          pending = null
          continue
        }
      }

      const dashMatch = line.match(/^([a-zA-Z\s\-]+)\s+[-–]\s+([^\s\-]+)\s+[-–]\s+(.+)$/)
      if (dashMatch) {
        english = dashMatch[1].trim()
        pronunciation = dashMatch[2].trim()
        const cd = splitChineseAndDef(cleanChinese(dashMatch[3]))
        chinese = cd.chinese
        definition = cd.definition
        if (english.length > 1 && chinese.length > 0) {
          pairs.push({ english, chinese, pronunciation, definition })
          pending = null
          continue
        }
      }

      const simpleMatch = line.match(/^([a-zA-Z\s\-]+)[\s\/\-：:]+(.+)$/)
      if (simpleMatch) {
        english = simpleMatch[1].trim()
        const cd = splitChineseAndDef(cleanChinese(simpleMatch[2]))
        chinese = cd.chinese
        definition = cd.definition
        if (english.length > 1 && chinese.length > 0 && /[a-zA-Z]/.test(english) && /[\u4e00-\u9fff]/.test(chinese)) {
          pairs.push({ english, chinese, pronunciation: '', definition })
          pending = null
          continue
        }
      }

      const engWithPhonetic = line.match(/^([a-zA-Z\s\-]+)\s+([\/\[].+[\/\]])$/)
      if (engWithPhonetic && !/[\u4e00-\u9fff]/.test(line)) {
        pending = { english: engWithPhonetic[1].trim(), pronunciation: engWithPhonetic[2].trim() }
        continue
      }

      if (/^[a-zA-Z\s\-]{2,}$/.test(line) && !/[\u4e00-\u9fff]/.test(line)) {
        pending = { english: line.trim(), pronunciation: '' }
        continue
      }

      if (pending && /[\u4e00-\u9fff]/.test(line)) {
        const cd = splitChineseAndDef(cleanChinese(line))
        pairs.push({
          english: pending.english,
          pronunciation: pending.pronunciation,
          chinese: cd.chinese,
          definition: cd.definition,
        })
        pending = null
        continue
      }
    }

    return pairs.filter(p => p.english && p.chinese)
  }

  const enrichPhonetics = async (parsed: TextImportResult[]) => {
    const missing = parsed.filter(p => !p.pronunciation)
    if (missing.length === 0) return parsed

    setFetchingPhonetics(true)
    const words = missing.map(p => p.english)
    const phoneticMap = await fetchPhoneticsBatch(words)

    const enriched = parsed.map(p => {
      if (p.pronunciation) return p
      const key = p.english.toLowerCase().trim()
      const fetched = phoneticMap.get(key) || ''
      return { ...p, pronunciation: fetched }
    })

    setFetchingPhonetics(false)
    return enriched
  }

  const processExtractedText = async (content: string) => {
    setText(content)
    const parsed = parseText(content)
    setResults(parsed)
    setSelectedResults(new Set(parsed.map((_, i) => i)))
    const enriched = await enrichPhonetics(parsed)
    setResults(enriched)
    setSelectedResults(new Set(enriched.map((_, i) => i)))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoadingDoc(true)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase()

      if (ext === 'pdf') {
        setLoadingMsg('正在解析PDF文档...')
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
        GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs'

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await getDocument({ data: arrayBuffer }).promise
        const textParts: string[] = []

        for (let i = 1; i <= pdf.numPages; i++) {
          setLoadingMsg(`正在解析PDF第 ${i}/${pdf.numPages} 页...`)
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item: any) => item.str).join(' ')
          textParts.push(pageText)
        }

        await processExtractedText(textParts.join('\n'))
      } else if (ext === 'docx') {
        setLoadingMsg('正在解析Word文档...')
        const mammoth = await import('mammoth')
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        await processExtractedText(result.value)
      } else {
        // fallback for plain text
        const reader = new FileReader()
        reader.onload = async (event) => {
          const content = event.target?.result as string
          await processExtractedText(content)
        }
        reader.readAsText(file, 'utf-8')
      }
    } catch (err) {
      console.error('文件解析失败:', err)
      setLoadingMsg('文件解析失败，请检查文件格式')
      setTimeout(() => setLoadingMsg(''), 3000)
    } finally {
      if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
        setLoadingDoc(false)
      }
    }
  }

  const handleTextChange = async (value: string) => {
    setText(value)
    const parsed = parseText(value)
    setResults(parsed)
    setSelectedResults(new Set(parsed.map((_, i) => i)))
    const enriched = await enrichPhonetics(parsed)
    setResults(enriched)
    setSelectedResults(new Set(enriched.map((_, i) => i)))
  }

  const confirmImport = () => {
    const selected = results.filter((_, i) => selectedResults.has(i))
    onResult(selected)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0d1b2a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-white">文本导入单词</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          {/* 文件上传 */}
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept=".docx,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loadingDoc}
              className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
            >
              <FileText className="w-6 h-6" />
              <span className="text-sm">{loadingDoc ? loadingMsg : '上传 Word / PDF 文档'}</span>
            </button>
            <p className="text-xs text-slate-500 text-center">
              支持 .docx 和 .pdf 文件，自动提取文本并解析单词
            </p>
          </div>

          {/* 文本输入框 */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">或直接粘贴文本</label>
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`格式示例（每行一对）：
abdominal 腹部 | 位于腹部的
aorta /eɪˈɔːrtə/ 主动脉 | 人体最大的动脉
artery 动脉
brachial - /ˈbreɪkiəl/ - 臂的

用 | 分隔中文和释义（可选）
英文和中文也可分行输入`}
              className="w-full h-32 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 text-sm resize-none focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* 音标查询中 */}
          {fetchingPhonetics && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="text-xs text-slate-400">正在查询音标...</span>
            </div>
          )}

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-xs text-slate-400">
                  识别到 {results.length} 个单词，勾选要导入的：
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {results.map((r, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                        selectedResults.has(i) ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/[0.02] border border-white/[0.05]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedResults.has(i)}
                        onChange={() => {
                          const next = new Set(selectedResults)
                          next.has(i) ? next.delete(i) : next.add(i)
                          setSelectedResults(next)
                        }}
                        className="accent-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white font-medium">{r.english}</span>
                        {r.pronunciation && (
                          <span className="text-xs text-cyan-400 mx-1">
                            {r.pronunciation.startsWith('/') || r.pronunciation.startsWith('[')
                              ? r.pronunciation
                              : `/${r.pronunciation}/`}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 mx-2">—</span>
                        <span className="text-sm text-slate-300">{r.chinese}</span>
                        {r.definition && (
                          <span className="text-xs text-slate-500 ml-1.5 italic">({r.definition})</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setText(''); setResults([]); }}
                    className="flex-1 py-2.5 border border-white/[0.08] text-slate-400 text-sm rounded-xl hover:bg-white/[0.04]"
                  >
                    清空
                  </button>
                  <button
                    onClick={confirmImport}
                    disabled={selectedResults.size === 0}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-xl flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> 导入选中 ({selectedResults.size})
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {results.length === 0 && text && !fetchingPhonetics && (
            <p className="text-xs text-yellow-400 text-center py-2">
              未识别到任何单词，请检查格式
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}