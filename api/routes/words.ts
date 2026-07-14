import { Router, type Request, type Response } from 'express'
import { getDb, saveDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

function rowsToObjects(results: any): any[] {
  if (results.length === 0) return []
  const columns = results[0].columns
  const values = results[0].values
  return values.map(row => {
    const obj: any = {}
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i]
    })
    return obj
  })
}

/**
 * Get all words in a subject
 * GET /api/subjects/:subjectId/words
 */
router.get('/subjects/:subjectId/words', (req: Request, res: Response): void => {
  const subjectId = parseInt(req.params.subjectId)

  if (isNaN(subjectId)) {
    res.status(400).json({ success: false, error: '无效的学科ID' })
    return
  }

  const db = getDb()

  try {
    const words = rowsToObjects(db.exec(`
      SELECT id, subject_id, english, chinese, pronunciation, definition, example_sentence, example_translation, root, root_meaning
      FROM words WHERE subject_id = ?
      ORDER BY id
    `, [subjectId]))

    res.json({
      success: true,
      data: { words, count: words.length },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * Add a word to a subject
 * POST /api/subjects/:subjectId/words
 * Requires authentication
 */
router.post('/subjects/:subjectId/words', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.userId!
  const subjectId = parseInt(req.params.subjectId)
  const { english, chinese, pronunciation, definition, example_sentence, example_translation, root, root_meaning } = req.body

  if (isNaN(subjectId)) {
    res.status(400).json({ success: false, error: '无效的学科ID' })
    return
  }

  if (!english || !chinese || english.trim().length === 0 || chinese.trim().length === 0) {
    res.status(400).json({ success: false, error: '英文和中文释义不能为空' })
    return
  }

  const db = getDb()

  try {
    // Check if subject exists and is not preset (or allow adding to custom subjects only)
    const check = rowsToObjects(db.exec(`SELECT is_preset FROM subjects WHERE id = ?`, [subjectId]))
    if (check.length === 0) {
      res.status(404).json({ success: false, error: '学科不存在' })
      return
    }

    db.run(`
      INSERT INTO words (subject_id, english, chinese, pronunciation, definition, example_sentence, example_translation, root, root_meaning)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      subjectId,
      english.trim(),
      chinese.trim(),
      pronunciation || '',
      definition || '',
      example_sentence || '',
      example_translation || '',
      root || '',
      root_meaning || '',
    ])

    const results = db.exec('SELECT last_insert_rowid()')
    const id = results[0].values[0][0] as number

    saveDb()

    res.json({
      success: true,
      data: {
        word: {
          id,
          subject_id: subjectId,
          english: english.trim(),
          chinese: chinese.trim(),
          pronunciation: pronunciation || '',
          definition: definition || '',
          example_sentence: example_sentence || '',
          example_translation: example_translation || '',
          root: root || '',
          root_meaning: root_meaning || '',
        },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * Delete a word
 * DELETE /api/words/:id
 * Requires authentication
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response): void => {
  const wordId = parseInt(req.params.id)

  if (isNaN(wordId)) {
    res.status(400).json({ success: false, error: '无效的单词ID' })
    return
  }

  const db = getDb()

  try {
    // Get the word and check if its subject is custom (not preset)
    const word = rowsToObjects(db.exec(`
      SELECT w.id, w.subject_id, s.is_preset
      FROM words w
      JOIN subjects s ON w.subject_id = s.id
      WHERE w.id = ?
    `, [wordId]))

    if (word.length === 0) {
      res.status(404).json({ success: false, error: '单词不存在' })
      return
    }

    if (word[0].is_preset === 1) {
      res.status(403).json({ success: false, error: '不能删除预设学科中的单词' })
      return
    }

    db.run(`DELETE FROM word_progress WHERE word_id = ?`, [wordId])
    db.run(`DELETE FROM words WHERE id = ?`, [wordId])

    saveDb()

    res.json({
      success: true,
      data: { id: wordId },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router