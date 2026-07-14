import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, Loader2, Check, Image as ImageIcon } from 'lucide-react'
import Tesseract from 'tesseract.js'

interface OcrResult {
  english: string
  chinese: string
}

interface Props {
  onResult: (words: OcrResult[]) => void
  onClose: () => void
}

export default function OcrImport({ onResult, onClose }: Props) {
  const [image, setImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState('')
  const [results, setResults] = useState<OcrResult[]>([])
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const parseOcrText = (text: string): OcrResult[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const pairs: OcrResult[] = []

    for (const line of lines) {
      // 尝试匹配英文-中文对
      // 格式: 英文 中文 或 英文/中文 或 英文-中文 或 英文：中文
      const match = line.match(/^([a-zA-Z\s\-]+)[\s\/\-：:]+(.+)$/)
      if (match) {
        const eng = match[1].trim()
        const chn = match[2].trim().replace(/[^a-zA-Z\u4e00-\u9fff\s]/g, '').trim()
        if (eng.length > 1 && chn.length > 0 && /[a-zA-Z]/.test(eng) && /[\u4e00-\u9fff]/.test(chn)) {
          pairs.push({ english: eng, chinese: chn })
          continue
        }
      }

      // 尝试提取独立的英文单词（大写开头或全小写）
      const engMatch = line.match(/^([a-zA-Z\s\-]{2,})$/)
      if (engMatch && !pairs.length) {
        continue
      }

      // 如果上一行是英文，当前行是中文，配对
      if (pairs.length > 0 && /[\u4e00-\u9fff]/.test(line) && !/[a-zA-Z]/.test(line)) {
        const last = pairs[pairs.length - 1]
        if (!last.chinese) {
          last.chinese = line.trim()
        }
      }
    }

    return pairs.filter(p => p.english && p.chinese)
  }

  const startOCR = async () => {
    if (!image) return
    setProcessing(true)
    setProgress('正在加载识别引擎...')

    try {
      const worker = await Tesseract.createWorker('eng+chi_sim', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(`识别中... ${Math.round(m.progress * 100)}%`)
          }
        },
      })

      const { data } = await worker.recognize(image)
      await worker.terminate()

      const parsed = parseOcrText(data.text)
      setResults(parsed)
      setSelectedResults(new Set(parsed.map((_, i) => i)))
      setProgress('')
    } catch (err) {
      setProgress('识别失败，请重试')
    }
    setProcessing(false)
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
          <h3 className="text-base font-medium text-white">拍照/图片导入单词</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {!image ? (
          <div className="space-y-3">
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])}
            />
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-600/30 transition-colors"
            >
              <Camera className="w-6 h-6" />
              <span className="text-sm">拍照识别</span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-300 hover:bg-white/[0.08] transition-colors"
            >
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm">上传图片</span>
            </button>
            <p className="text-xs text-slate-500 text-center mt-2">
              支持拍照或上传包含英文单词和中文释义的图片，自动识别并提取单词
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img src={image} alt="preview" className="w-full rounded-xl border border-white/[0.08]" />
              <button
                onClick={() => { setImage(null); setResults([]); setProgress('') }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!results.length && !processing && (
              <button
                onClick={startOCR}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl"
              >
                <Upload className="w-4 h-4" /> 开始识别
              </button>
            )}

            {processing && (
              <div className="flex items-center justify-center gap-3 py-4 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-sm">{progress}</span>
              </div>
            )}

            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <p className="text-xs text-slate-400">识别到 {results.length} 个单词，勾选要导入的：</p>
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
                          <span className="text-xs text-slate-500 mx-2">—</span>
                          <span className="text-sm text-slate-300">{r.chinese}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setResults([]); setProgress('') }}
                      className="flex-1 py-2.5 border border-white/[0.08] text-slate-400 text-sm rounded-xl hover:bg-white/[0.04]"
                    >
                      重新识别
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
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}