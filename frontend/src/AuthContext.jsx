import { createContext, useContext, useState, useEffect } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (localStorage.getItem('token')) {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      Promise.race([api.getMe(), timeout])
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    const { access_token } = await api.login({ email, password })
    localStorage.setItem('token', access_token)
    const me = await api.getMe()
    setUser(me)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  async function refreshUser() {
    if (localStorage.getItem('token')) {
      try { setUser(await api.getMe()) } catch {}
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div className="loading">読み込み中...</div>
        </div>
      ) : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
