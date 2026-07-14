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
 * Get all subjects with word count and known count for current user
 * GET /api/subjects
 * Requires authentication
 */
router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.userId!
  const db = getDb()

  try {
    // Get all subjects with total word count, and known count for current user
    const subjects = rowsToObjects(db.exec(`
      SELECT
        s.id,
        s.name,
        s.icon,
        s.is_preset,
        COUNT(w.id) as total_words,
        SUM(CASE WHEN wp.status = 'known' THEN 1 ELSE 0 END) as known_words
      FROM subjects s
      LEFT JOIN words w ON w.subject_id = s.id
      LEFT JOIN word_progress wp ON wp.word_id = w.id AND wp.user_id = ?
      GROUP BY s.id
      ORDER BY s.id
    `, [userId]))

    res.json({
      success: true,
      data: { subjects },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * Create custom subject
 * POST /api/subjects
 * Requires authentication
 */
router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.userId!
  const { name, icon } = req.body

  if (!name || name.trim().length === 0) {
    res.status(400).json({ success: false, error: '学科名称不能为空' })
    return
  }

  const db = getDb()

  try {
    db.run(`INSERT INTO subjects (name, icon, is_preset) VALUES (?, ?, 0)`, [
      name.trim(),
      icon || '📚',
    ])

    const results = db.exec('SELECT last_insert_rowid()')
    const id = results[0].values[0][0] as number

    saveDb()

    res.json({
      success: true,
      data: {
        subject: {
          id,
          name: name.trim(),
          icon: icon || '📚',
          is_preset: 0,
          total_words: 0,
          known_words: 0,
        },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * Delete custom subject
 * DELETE /api/subjects/:id
 * Requires authentication
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.userId!
  const subjectId = parseInt(req.params.id)

  if (isNaN(subjectId)) {
    res.status(400).json({ success: false, error: '无效的学科ID' })
    return
  }

  const db = getDb()

  try {
    // Check if subject exists and is not preset
    const check = rowsToObjects(db.exec(`SELECT is_preset FROM subjects WHERE id = ?`, [subjectId]))
    if (check.length === 0) {
      res.status(404).json({ success: false, error: '学科不存在' })
      return
    }
    if (check[0].is_preset === 1) {
      res.status(403).json({ success: false, error: '不能删除预设学科' })
      return
    }

    // Delete words in this subject
    db.run(`DELETE FROM words WHERE subject_id = ?`, [subjectId])
    // Delete subject itself
    db.run(`DELETE FROM subjects WHERE id = ?`, [subjectId])
    // Remove from user_subjects
    db.run(`DELETE FROM user_subjects WHERE subject_id = ?`, [subjectId])

    saveDb()

    res.json({
      success: true,
      data: { id: subjectId },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router