/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDatabase } from './db.js'
import authRoutes from './routes/auth.js'
import subjectsRoutes from './routes/subjects.js'
import wordsRoutes from './routes/words.js'
import progressRoutes from './routes/progress.js'
import searchRoutes from './routes/search.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 生产环境：托管前端静态文件
const distPath = path.resolve(__dirname, '..', 'dist')
app.use(express.static(distPath))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/subjects', subjectsRoutes)
app.use('/api/words', wordsRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/search', searchRoutes)

/**
 * health
 */
app.get(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler - SPA fallback
 */
app.use((req: Request, res: Response) => {
  if (req.accepts('html')) {
    res.sendFile(path.resolve(distPath, 'index.html'))
  } else {
    res.status(404).json({
      success: false,
      error: 'API not found',
    })
  }
})

/**
 * Initialize database on startup
 */
initDatabase()
  .then(() => {
    console.log('Database initialized successfully')
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err)
  })

export default app
