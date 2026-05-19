import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import Pagination from '../components/Pagination'
import PostCard, { ComposeArea } from '../components/PostCard'
import { fuzzyFilter } from '../utils/fuzzy'

const LIMIT = 20

// ── メインページ ──
export default function PostsPage() {
  const { user }              = useAuth()
  const [data, setData]       = useState(null)
  const [schools, setSchools] = useState([])
  const [q, setQ]             = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [order, setOrder]     = useState('desc')
  const [skip, setSkip]       = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getSchools({ limit: 1000 }).then(d => setSchools(d.items)) }, [])

  const fetchPosts = useCallback(() => {
    setLoading(true)
    api.getPosts({ q, school_name: schoolName || undefined, sort_by: 'created_at', order, skip, limit: LIMIT, top_level_only: true })
      .then(setData).finally(() => setLoading(false))
  }, [q, schoolName, order, skip])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  async function handleReact(postId, reaction) {
    if (!user) return alert('ログインが必要です')
    await api.reactToPost(postId, { reaction })
    fetchPosts()
  }
  async function handleReactRepost(repostId, reaction) {
    if (!user) return alert('ログインが必要です')
    try { await api.reactToRepost(repostId, { reaction }); fetchPosts() } catch (e) { alert(e.message) }
  }
  async function handleDelete(postId) {
    if (!confirm('この投稿を削除しますか？')) return
    await api.deletePost(postId); fetchPosts()
  }

  return (
    <div className="container">
      <h1 className="page-title">タイムライン</h1>

      {user && <ComposeArea user={user} onPosted={fetchPosts} />}

      {/* 検索 */}
      <div className="search-bar">
        <input
          placeholder="🔍 内容を検索..."
          value={q}
          onChange={e => { setQ(e.target.value); setSkip(0) }}
        />
        <FuzzySchoolSearch schools={schools} value={schoolName} onChange={v => { setSchoolName(v); setSkip(0) }} />
        <select value={order} onChange={e => { setOrder(e.target.value); setSkip(0) }}>
          <option value="desc">新しい順</option>
          <option value="asc">古い順</option>
        </select>
      </div>

      {loading
        ? <div className="loading">読み込み中...</div>
        : (
          <>
            {data?.items.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>投稿がありません</p>}
            {data?.items.map(post => (
              <PostCard
                key={post.id}
                post={post}
                user={user}
                schools={schools}
                onReact={handleReact}
                onReactRepost={handleReactRepost}
                onDelete={handleDelete}
                onReplied={fetchPosts}
              />
            ))}
            {data && <Pagination skip={skip} limit={LIMIT} total={data.total} onChange={setSkip} />}
          </>
        )
      }
    </div>
  )
}

// ── 学校名ファジー検索コンポーネント ──
function FuzzySchoolSearch({ schools, value, onChange }) {
  const [input, setInput]     = useState(value)
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!input.trim()) { setResults([]); return }
    const r = fuzzyFilter(schools, input, s => s.name).slice(0, 8)
    setResults(r)
    setOpen(r.length > 0)
  }, [input, schools])

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(name) { setInput(name); onChange(name); setOpen(false) }
  function clear() { setInput(''); onChange(''); setOpen(false) }

  return (
    <div ref={ref} className="autocomplete-wrap" style={{ flex: 1, minWidth: 160 }}>
      <div style={{ position: 'relative' }}>
        <input
          className="autocomplete-input"
          style={{ borderRadius: 'var(--r-pill)', paddingRight: input ? '2rem' : undefined }}
          placeholder="🏫 大学名で絞り込み..."
          value={input}
          onChange={e => { setInput(e.target.value); onChange(e.target.value) }}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {input && (
          <button onClick={clear} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.85rem' }}>✕</button>
        )}
      </div>
      {open && (
        <div className="autocomplete-dropdown">
          {results.map(({ item, highlighted }) => (
            <div key={item.id} className="autocomplete-item" onMouseDown={() => select(item.name)}
              dangerouslySetInnerHTML={{ __html: highlighted }} />
          ))}
        </div>
      )}
    </div>
  )
}
