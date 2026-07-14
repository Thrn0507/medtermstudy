import { create } from 'zustand'
import { loginUser, registerUser } from '@/lib/localData'

interface User {
  id: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => void
  fetchUser: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const result = loginUser(email, password)
      if (result.success && result.user) {
        const token = result.user.id
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(result.user))
        set({ user: result.user, token, isAuthenticated: true, loading: false })
        return true
      }
      set({ loading: false })
      return false
    } catch {
      set({ loading: false })
      return false
    }
  },

  register: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const result = registerUser(email, password)
      if (result.success && result.user) {
        const token = result.user.id
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(result.user))
        set({ user: result.user, token, isAuthenticated: true, loading: false })
        return true
      }
      set({ loading: false })
      return false
    } catch {
      set({ loading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  fetchUser: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ user, token, isAuthenticated: true })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  },
}))