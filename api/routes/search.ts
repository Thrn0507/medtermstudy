import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

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
 * Search words by keyword
 * GET /api/search?q=keyword&type=root
 * type can be: 'all', 'root', 'english', 'chinese'
 * default is 'all'
 */
router.get('/', (req: Request, res: Response): void => {
  const q = (req.query.q || '').toString().trim()
  const type = (req.query.type || 'all').toString()

  if (q.length === 0) {
    res.status(400).json({ success: false, error: '搜索关键词不能为空' })
    return
  }

  const db = getDb()

  try {
    let sql = `
      SELECT w.*, s.name as subject_name
      FROM words w
      JOIN subjects s ON w.subject_id = s.id
      WHERE 1=1
    `
    const params: string[] = []

    const keyword = `%${q}%`

    if (type === 'root') {
      sql += ` AND w.root LIKE ?`
      params.push(keyword)
    } else if (type === 'english') {
      sql += ` AND w.english LIKE ?`
      params.push(keyword)
    } else if (type === 'chinese') {
      sql += ` AND w.chinese LIKE ?`
      params.push(keyword)
    } else {
      // default: all
      sql += ` AND (w.english LIKE ? OR w.chinese LIKE ? OR w.root LIKE ?)`
      params.push(keyword, keyword, keyword)
    }

    sql += ` ORDER BY w.english LIMIT 50`

    const results = db.exec(sql, params)
    const words = rowsToObjects(results)

    res.json({
      success: true,
      data: { words, count: words.length, query: q, type },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router