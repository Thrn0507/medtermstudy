// 发音工具：自动查询音标 + 语音朗读

const phoneticCache = new Map<string, string>()

// 从 Free Dictionary API 查询音标
export async function fetchPhonetic(word: string): Promise<string> {
  const key = word.toLowerCase().trim()
  if (phoneticCache.has(key)) return phoneticCache.get(key)!

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`)
    if (!res.ok) {
      phoneticCache.set(key, '')
      return ''
    }
    const data = await res.json()
    const entry = data?.[0]
    if (!entry) {
      phoneticCache.set(key, '')
      return ''
    }

    // 优先取 phonetic，否则取 phonetics[0].text
    let phonetic = entry.phonetic || ''
    if (!phonetic && entry.phonetics?.length > 0) {
      phonetic = entry.phonetics[0].text || ''
    }
    phoneticCache.set(key, phonetic)
    return phonetic
  } catch {
    phoneticCache.set(key, '')
    return ''
  }
}

// 批量查询音标
export async function fetchPhoneticsBatch(words: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  const uncached = words.filter(w => !phoneticCache.has(w.toLowerCase().trim()))

  // 并发查询，每批最多 5 个
  const batchSize = 5
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize)
    const promises = batch.map(async (word) => {
      const phonetic = await fetchPhonetic(word)
      results.set(word.toLowerCase().trim(), phonetic)
    })
    await Promise.allSettled(promises)
  }

  return results
}

// 使用 Web Speech API 朗读单词
export function speakWord(word: string): void {
  if (!('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.85
  utterance.pitch = 1

  // 优先选择英语语音
  const voices = window.speechSynthesis.getVoices()
  const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Samantha'))
    || voices.find(v => v.lang.startsWith('en-US'))
    || voices.find(v => v.lang.startsWith('en'))
  if (enVoice) utterance.voice = enVoice

  window.speechSynthesis.speak(utterance)
}