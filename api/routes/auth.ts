import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const JWT_SECRET = 'medterm-secret-key-2024'
const router = Router()

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ success: false, error: '邮箱和密码不能为空' })
    return
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, error: '密码长度至少为6位' })
    return
  }

  const db = getDb()

  try {
    // Check if email exists
    const existing = db.exec(`SELECT id FROM users WHERE email = ?`, [email])
    if (existing.length > 0 && existing[0].values.length > 0) {
      res.status(400).json({ success: false, error: '该邮箱已被注册' })
      return
    }

    const passwordHash = bcrypt.hashSync(password, 10)
    db.run(`INSERT INTO users (email, password_hash) VALUES (?, ?)`, [email, passwordHash])

    const results = db.exec('SELECT last_insert_rowid()')
    const userId = results[0].values[0][0] as number
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      success: true,
      data: {
        token,
        user: { id: userId, email, created_at: (new Date()).toISOString() },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ success: false, error: '邮箱和密码不能为空' })
    return
  }

  const db = getDb()

  try {
    const results = db.exec(`SELECT id, email, password_hash, created_at FROM users WHERE email = ?`, [email])

    if (results.length === 0 || results[0].values.length === 0) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' })
      return
    }

    const row = results[0].values[0]
    const columns = results[0].columns
    const user: any = {}
    columns.forEach((col, i) => {
      user[col] = row[i]
    })

    if (!bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' })
      return
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, created_at: user.created_at },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * Get current user info
 * GET /api/auth/me
 * Requires authentication
 */
router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.userId
  const db = getDb()

  try {
    const results = db.exec(`SELECT id, email, created_at FROM users WHERE id = ?`, [userId])

    if (results.length === 0 || results[0].values.length === 0) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const row = results[0].values[0]
    const columns = results[0].columns
    const user: any = {}
    columns.forEach((col, i) => {
      user[col] = row[i]
    })

    res.json({
      success: true,
      data: { user },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router