import { create } from 'zustand'
import queryClient from '../lib/queryClient'

const storedUser = () => {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

const useAuthStore = create((set) => ({
  user: storedUser(),
  token: localStorage.getItem('token') || null,
  // Require BOTH a token and a parseable user; otherwise a valid token with a
  // corrupted/missing `user` entry would hydrate as authenticated with user:null
  // and crash any component that reads user.name/avatar behind the auth guard.
  isAuthenticated: !!localStorage.getItem('token') && !!storedUser(),

  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
    // Logout is an SPA transition, so the react-query cache would otherwise
    // survive into the next session. Query keys are not user-scoped, so the
    // next user to sign in on this tab would briefly see the previous user's
    // notifications, dashboard and posts served stale-while-revalidate.
    queryClient.clear()
  },
}))

export default useAuthStore
