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
 * Update word progress
 * POST /api/progress
 * Requires authentication
 * Body: { wordId, status: 'known' | 'unknown' }
 */
router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.userId!
  const { wordId, status } = req.body

  if (!wordId || !['known', 'unknown'].includes(status)) {
    res.status(400).json({ success: false, error: '无效的参数，请提供wordId和status（known/unknown）' })
    return
  }

  const today = new Date().toISOString().split('T')[0]
  const db = getDb()

  try {
    // Upsert: update if exists, insert if not
    const existing = rowsToObjects(db.exec(`
      SELECT id FROM word_progress WHERE user_id = ? AND word_id = ?
    `, [userId, wordId]))

    if (existing.length > 0) {
      db.run(`
        UPDATE word_progress
        SET status = ?, review_count = review_count + 1, last_reviewed_at = ?
        WHERE user_id = ? AND word_id = ?
      `, [status, today, userId, wordId])
    } else {
      db.run(`
        INSERT INTO word_progress (user_id, word_id, status, review_count, last_reviewed_at)
        VALUES (?, ?, ?, 1, ?)
      `, [userId, wordId, status, today])
    }

    saveDb()

    res.json({
      success: true,
      data: { wordId, status },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * Get overall learning statistics
 * GET /api/progress
 * Requires authentication
 */
router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.userId!
  const db = getDb()

  try {
    const totalWordsResult = db.exec(`SELECT COUNT(*) as total FROM words`)
    const totalWords = totalWordsResult.length > 0 ? totalWordsResult[0].values[0][0] as number : 0

    const knownWordsResult = db.exec(`
      SELECT COUNT(*) as known
      FROM word_progress
      WHERE user_id = ? AND status = 'known'
    `, [userId])
    const knownWords = knownWordsResult.length > 0 ? knownWordsResult[0].values[0][0] as number : 0

    const unknownWordsResult = db.exec(`
      SELECT COUNT(*) as unknown
      FROM word_progress
      WHERE user_id = ? AND status = 'unknown'
    `, [userId])
    const unknownWords = unknownWordsResult.length > 0 ? unknownWordsResult[0].values[0][0] as number : 0

    const totalReviewsResult = db.exec(`
      SELECT IFNULL(SUM(review_count), 0) as total_reviews
      FROM word_progress
      WHERE user_id = ?
    `, [userId])
    const totalReviews = totalReviewsResult.length > 0 ? totalReviewsResult[0].values[0][0] as number : 0

    const bySubject = rowsToObjects(db.exec(`
      SELECT
        s.id,
        s.name,
        s.icon,
        COUNT(w.id) as total_words,
        SUM(CASE WHEN wp.status = 'known' THEN 1 ELSE 0 END) as known_words,
        SUM(CASE WHEN wp.status = 'unknown' THEN 1 ELSE 0 END) as unknown_words
      FROM subjects s
      LEFT JOIN words w ON w.subject_id = s.id
      LEFT JOIN word_progress wp ON wp.word_id = w.id AND wp.user_id = ?
      GROUP BY s.id
      ORDER BY s.id
    `, [userId]))

    res.json({
      success: true,
      data: {
        total_words: totalWords,
        known_words: knownWords,
        unknown_words: unknownWords,
        total_reviews: totalReviews,
        completion_percent: totalWords > 0 ? Math.round((knownWords / totalWords) * 100) : 0,
        by_subject: bySubject,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * Get today's words to review
 * GET /api/progress/review
 * Requires authentication
 */
router.get('/review', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.userId!
  const today = new Date().toISOString().split('T')[0]
  const db = getDb()

  try {
    // Words that are either never reviewed (status unknown) or last reviewed was not today
    const words = rowsToObjects(db.exec(`
      SELECT
        w.*,
        wp.status,
        wp.review_count,
        wp.last_reviewed_at,
        s.name as subject_name
      FROM words w
      LEFT JOIN word_progress wp ON wp.word_id = w.id AND wp.user_id = ?
      LEFT JOIN subjects s ON w.subject_id = s.id
      WHERE wp.status IS NULL OR wp.status = 'unknown' OR wp.last_reviewed_at != ?
      ORDER BY RANDOM()
      LIMIT 50
    `, [userId, today]))

    res.json({
      success: true,
      data: { words, count: words.length },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router