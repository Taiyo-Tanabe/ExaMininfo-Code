import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { api } from '../api'

export default function LoginPage() {
  const [tab, setTab]     = useState('login')
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  function switchTab(t) { setTab(t); setError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'register') {
        await api.register({ name, email, password: pass })
      }
      await login(email, pass)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      {/* ロゴ */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1.5rem' }}>
        <img src="/logo-em.svg" alt="ExaMininfo" style={{ height: 48, objectFit: 'contain' }} />
      </div>

      <div className="card">
        <div className="tabs">
          <div className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
            ログイン
          </div>
          <div className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>
            新規登録
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="form-group">
              <label>名前</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
                placeholder="ユーザー名"
              />
            </div>
          )}

          <div className="form-group">
            <label>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus={tab === 'login'}
              placeholder="example@mail.com"
            />
          </div>

          <div className="form-group">
            <label>パスワード</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
              placeholder="6文字以上"
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
            disabled={loading}
          >
            {loading ? '処理中...' : tab === 'login' ? 'ログイン' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  )
}
