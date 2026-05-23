import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { fuzzyFilter } from '../utils/fuzzy'
import Pagination from '../components/Pagination'
import PostCard, { MentionTextarea, Avatar } from '../components/PostCard'
import SchoolAutocomplete from '../components/SchoolAutocomplete'

const LIMIT = 10

const SORT_OPTIONS = [
  { value: 'created_at-desc',    label: '投稿日（新しい順）',  sort_by: 'created_at',    order: 'desc' },
  { value: 'created_at-asc',     label: '投稿日（古い順）',    sort_by: 'created_at',    order: 'asc'  },
  { value: 'occurred_date-desc', label: '発生日（新しい順）',  sort_by: 'occurred_date', order: 'desc' },
  { value: 'occurred_date-asc',  label: '発生日（古い順）',    sort_by: 'occurred_date', order: 'asc'  },
  { value: 'title-asc',          label: 'タイトル（昇順）',    sort_by: 'title',         order: 'asc'  },
  { value: 'title-desc',         label: 'タイトル（降順）',    sort_by: 'title',         order: 'desc' },
]

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
}

function fmtPartialDate(inc) {
  const y = inc.occurred_year, m = inc.occurred_month, d = inc.occurred_day
  if (y == null && m == null && d == null) return null
  const yStr = y != null ? `${y}年` : '不明年'
  const mStr = m != null ? `${m}月` : '不明月'
  const dStr = d != null ? `${d}日` : '不明日'
  return yStr + mStr + dStr
}

function SchoolSearch({ schools, value, onChange }) {
  const [input, setInput]   = useState(value)
  const [results, setResults] = useState([])
  const [open, setOpen]     = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!input.trim()) { setResults([]); setOpen(false); return }
    const byName = fuzzyFilter(schools, input, s => s.name)
    const foundIds = new Set(byName.map(r => r.item.id))
    const byYomi = fuzzyFilter(schools.filter(s => !foundIds.has(s.id)), input, s => s.yomi || '').map(r => ({ ...r, highlighted: r.item.name }))
    const r = [...byName, ...byYomi].slice(0, 8)
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
    <div ref={ref} className="autocomplete-wrap" style={{ flex: 1 }}>
      <div style={{ position: 'relative' }}>
        <input
          className="autocomplete-input"
          placeholder="🏫 大学名で絞り込み（ローマ字・ひらがな対応）"
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
          {results.map(({ item: s, highlighted }) => (
            <div key={s.id} className="autocomplete-item" onMouseDown={() => select(s.name)}>
              <span dangerouslySetInnerHTML={{ __html: highlighted }} />
              <span style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: '0.5rem' }}>{s.prefecture}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IncidentComposeForm({ schools, onCreated, onCancel }) {
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [schoolId, setSchoolId]     = useState(null)
  const [courseName, setCourseName] = useState('')
  const [year, setYear]             = useState('')
  const [month, setMonth]           = useState('')
  const [day, setDay]               = useState('')
  const [error, setError]           = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!title.trim()) { setError('タイトルを入力してください'); return }
    if (!schoolId)     { setError('大学を選択してください'); return }
    setSubmitting(true); setError('')
    try {
      await api.createIncident({
        title: title.trim(),
        description: description.trim() || null,
        school_id: Number(schoolId),
        course_name: courseName.trim() || null,
        occurred_year:  year  ? Number(year)  : null,
        occurred_month: month ? Number(month) : null,
        occurred_day:   day   ? Number(day)   : null,
      })
      onCreated?.()
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  const inputStyle = {
    width: '100%', padding: '0.5rem 0.75rem', background: 'var(--input-bg)',
    border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
    color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.9rem',
    boxSizing: 'border-box',
  }

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>事件を投稿</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ overflow: 'visible' }}>
          <SchoolAutocomplete schools={schools} schoolId={schoolId} onSelect={setSchoolId} placeholder="🏫 大学を選択..." />
        </div>
        <input style={inputStyle} placeholder="タイトル *" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
          placeholder="詳細（任意）"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />
        <input style={inputStyle} placeholder="コース名（任意）" value={courseName} onChange={e => setCourseName(e.target.value)} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="年" type="number" min="1900" max="2100" value={year}  onChange={e => setYear(e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }} placeholder="月" type="number" min="1" max="12"   value={month} onChange={e => setMonth(e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }} placeholder="日" type="number" min="1" max="31"   value={day}   onChange={e => setDay(e.target.value)} />
        </div>
        {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          {onCancel && <button className="btn btn-ghost btn-sm" onClick={onCancel}>キャンセル</button>}
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '投稿中...' : '投稿する'}
          </button>
        </div>
      </div>
    </div>
  )
}

function IncidentEditForm({ inc, schools, onSaved, onCancel }) {
  const [title, setTitle]           = useState(inc.title)
  const [description, setDescription] = useState(inc.description || '')
  const [courseName, setCourseName] = useState(inc.course_name || '')
  const [year, setYear]             = useState(inc.occurred_year  ?? '')
  const [month, setMonth]           = useState(inc.occurred_month ?? '')
  const [day, setDay]               = useState(inc.occurred_day   ?? '')
  const [error, setError]           = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSave() {
    if (!title.trim()) { setError('タイトルを入力してください'); return }
    setSubmitting(true); setError('')
    try {
      await api.updateIncident(inc.id, {
        title: title.trim(),
        description: description.trim() || null,
        school_id: inc.school_id,
        course_name: courseName.trim() || null,
        occurred_year:  year  ? Number(year)  : null,
        occurred_month: month ? Number(month) : null,
        occurred_day:   day   ? Number(day)   : null,
      })
      onSaved?.()
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  const inputStyle = {
    width: '100%', padding: '0.45rem 0.7rem', background: 'var(--input-bg)',
    border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
    color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.875rem',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input style={inputStyle} placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} placeholder="詳細（任意）" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
      <input style={inputStyle} placeholder="コース名（任意）" value={courseName} onChange={e => setCourseName(e.target.value)} />
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <input style={{ ...inputStyle, flex: 1 }} placeholder="年" type="number" value={year}  onChange={e => setYear(e.target.value)} />
        <input style={{ ...inputStyle, flex: 1 }} placeholder="月" type="number" value={month} onChange={e => setMonth(e.target.value)} />
        <input style={{ ...inputStyle, flex: 1 }} placeholder="日" type="number" value={day}   onChange={e => setDay(e.target.value)} />
      </div>
      {error && <p className="error" style={{ margin: 0, fontSize: '0.8rem' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>キャンセル</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={submitting}>
          {submitting ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}

function IncidentCommentSection({ inc, user }) {
  const [posts, setPosts]       = useState(null)
  const [content, setContent]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

  const loadPosts = useCallback(() => {
    api.getPosts({ incident_id: inc.id, top_level_only: true, sort_by: 'created_at', order: 'asc', limit: 30 })
      .then(d => setPosts(d.items))
  }, [inc.id])

  useEffect(() => { loadPosts() }, [loadPosts])

  async function handleComment() {
    if (!content.trim()) { setError('内容を入力してください'); return }
    setSubmitting(true); setError('')
    try {
      await api.createPost({
        school_id: inc.school_id,
        content: content.trim(),
        incident_id: inc.id,
      })
      setContent('')
      loadPosts()
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  async function handleReact(postId, reaction) {
    if (!user) return alert('ログインが必要です')
    await api.reactToPost(postId, { reaction })
    loadPosts()
  }

  async function handleReactRepost(repostId, reaction) {
    if (!user) return alert('ログインが必要です')
    try { await api.reactToRepost(repostId, { reaction }); loadPosts() } catch (e) { alert(e.message) }
  }

  async function handleDelete(id, type = 'post') {
    if (!confirm('削除しますか？')) return
    if (type === 'repost') await api.deleteRepost(id)
    else await api.deletePost(id)
    loadPosts()
  }

  return (
    <div style={{ borderTop: '1px solid var(--border-soft)', padding: '0.75rem 1rem 0.25rem' }}>
      {user && (
        <div style={{ marginBottom: '0.75rem' }}>
          <MentionTextarea
            value={content}
            onChange={setContent}
            placeholder="コメントを入力... (@でメンション)"
            rows={2}
            style={{
              width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', outline: 'none', color: 'var(--text)',
              fontFamily: 'inherit', fontSize: '0.875rem', resize: 'none',
              padding: '0.5rem 0.75rem', boxSizing: 'border-box',
            }}
          />
          {error && <p className="error" style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleComment}
              disabled={submitting || !content.trim()}
            >
              {submitting ? '送信中...' : 'コメントする'}
            </button>
          </div>
        </div>
      )}

      {posts === null ? (
        <div className="loading" style={{ padding: '0.5rem 0', fontSize: '0.85rem' }}>読み込み中...</div>
      ) : posts.length === 0 ? (
        <p className="muted" style={{ fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem 0 0.75rem' }}>
          コメントはまだありません
        </p>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            onReact={handleReact}
            onReactRepost={handleReactRepost}
            onDelete={handleDelete}
            onReplied={loadPosts}
          />
        ))
      )}
    </div>
  )
}

function IncidentReportButton({ user, incidentId }) {
  const [open, setOpen]     = useState(false)
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  if (!user) return null
  async function handleReport() {
    setSending(true)
    try {
      await api.createReport({ target_type: 'incident', target_id: incidentId, reason: reason || null })
      setOpen(false); setReason('')
      alert('通報しました。ご協力ありがとうございます。')
    } catch (e) { alert(e.message) }
    finally { setSending(false) }
  }
  return (
    <>
      <button
        className="post-action-btn"
        style={{ fontSize: '0.76rem', color: 'var(--muted)', marginLeft: 'auto' }}
        onClick={() => setOpen(o => !o)}
        title="通報"
      >🚩</button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 200,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '0.75rem', width: 220,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>この事件を通報</p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="理由（任意）"
            rows={2}
            style={{
              width: '100%', fontSize: '0.82rem', resize: 'none',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)', padding: '0.3rem 0.4rem',
              color: 'var(--text)', fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>キャンセル</button>
            <button className="btn btn-primary btn-sm" onClick={handleReport} disabled={sending}>
              {sending ? '送信中...' : '送信'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function IncidentCard({ inc, user, schoolMap, onReact, onDelete, onUpdated, schools }) {
  const [showComments, setShowComments] = useState(false)
  const [editing, setEditing]           = useState(false)
  const isOwn  = user && user.id === inc.user_id
  const isAdmin = user && user.role === 'admin'
  const canEdit = isOwn || isAdmin

  return (
    <div className="card" style={{ padding: 0, marginBottom: '0.75rem', overflow: 'visible' }}>
      <div style={{ padding: '1rem 1rem 0.75rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{inc.title}</h2>
          {fmtPartialDate(inc) && (
            <span className="badge badge-sakura" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>📅 {fmtPartialDate(inc)}</span>
          )}
        </div>

        {editing ? (
          <IncidentEditForm
            inc={inc}
            schools={schools}
            onSaved={() => { setEditing(false); onUpdated?.() }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            {inc.course_name && (
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--primary)' }}>📚 {inc.course_name}</p>
            )}
            {inc.description && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>
                {inc.description}
              </p>
            )}
          </>
        )}

        {/* Meta row */}
        <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)' }}>
          {schoolMap[inc.school_id] && (
            <Link to={`/schools/${inc.school_id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              🏫 {schoolMap[inc.school_id]}
            </Link>
          )}
          {inc.user_name && (
            <Link to={`/users/${inc.user_id}`} style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Avatar name={inc.user_name} avatarUrl={inc.user_avatar_url} positionX={inc.user_avatar_position_x} positionY={inc.user_avatar_position_y} size={18} />
              {inc.user_name}
            </Link>
          )}
          <span>投稿日 {fmt(inc.created_at)}</span>
        </div>

        {/* Action row */}
        <div className="post-actions" style={{ marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-soft)', position: 'relative' }}>
          {user && user.id !== inc.user_id && (
            <>
              <button className="post-action-btn like-btn" onClick={() => onReact(inc.id, 'like')}>
                👍 {inc.like_count || ''}
              </button>
              <button className="post-action-btn dislike-btn" onClick={() => onReact(inc.id, 'dislike')}>
                👎 {inc.dislike_count || ''}
              </button>
            </>
          )}
          {(!user || user.id === inc.user_id) && (
            <>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>👍 {inc.like_count || 0}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: '0.4rem' }}>👎 {inc.dislike_count || 0}</span>
            </>
          )}
          <button
            className="post-action-btn reply-btn"
            onClick={() => setShowComments(v => !v)}
          >
            💬 {inc.comment_count > 0 ? inc.comment_count : ''} {showComments ? '閉じる' : 'コメント'}
          </button>
          {canEdit && !editing && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
              {isOwn && (
                <button className="post-action-btn" style={{ fontSize: '0.76rem' }} onClick={() => setEditing(true)}>✏️</button>
              )}
              <button className="post-action-btn delete-btn" onClick={() => onDelete(inc.id)}>🗑</button>
            </div>
          )}
          {user && user.id !== inc.user_id && <IncidentReportButton user={user} incidentId={inc.id} />}
        </div>
      </div>

      {showComments && (
        <IncidentCommentSection inc={inc} user={user} />
      )}
    </div>
  )
}

export default function IncidentsPage() {
  const { user }                    = useAuth()
  const [data, setData]             = useState(null)
  const [schools, setSchools]       = useState([])
  const [schoolMap, setSchoolMap]   = useState({})
  const [q, setQ]                   = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [sort, setSort]             = useState('created_at-desc')
  const [skip, setSkip]             = useState(0)
  const [loading, setLoading]       = useState(true)
  const [showCompose, setShowCompose] = useState(false)

  useEffect(() => {
    api.getSchools({ limit: 1000 }).then(d => {
      setSchools(d.items)
      const map = {}
      d.items.forEach(s => { map[s.id] = s.name })
      setSchoolMap(map)
    })
  }, [])

  const { sort_by, order } = SORT_OPTIONS.find(o => o.value === sort)

  const fetchIncidents = useCallback(() => {
    setLoading(true)
    api.getIncidents({ q, school_name: schoolName || undefined, sort_by, order, skip, limit: LIMIT })
      .then(setData)
      .finally(() => setLoading(false))
  }, [q, schoolName, sort_by, order, skip])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  async function handleReact(incId, reaction) {
    if (!user) return alert('ログインが必要です')
    await api.reactToIncident(incId, { reaction })
    fetchIncidents()
  }

  async function handleDelete(incId) {
    if (!confirm('この事件を削除しますか？')) return
    await api.deleteIncident(incId)
    fetchIncidents()
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>事件一覧</h1>
        {user && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCompose(v => !v)}>
            {showCompose ? '✕ 閉じる' : '＋ 事件を投稿'}
          </button>
        )}
      </div>

      {user && showCompose && (
        <IncidentComposeForm
          schools={schools}
          onCreated={() => { setShowCompose(false); fetchIncidents() }}
          onCancel={() => setShowCompose(false)}
        />
      )}

      <div className="search-bar">
        <input placeholder="🔍 タイトル・内容で検索..." value={q} onChange={e => { setQ(e.target.value); setSkip(0) }} />
        <SchoolSearch schools={schools} value={schoolName} onChange={v => { setSchoolName(v); setSkip(0) }} />
        <select value={sort} onChange={e => { setSort(e.target.value); setSkip(0) }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : (
        <>
          {data?.items.map(inc => (
            <IncidentCard
              key={inc.id}
              inc={inc}
              user={user}
              schoolMap={schoolMap}
              schools={schools}
              onReact={handleReact}
              onDelete={handleDelete}
              onUpdated={fetchIncidents}
            />
          ))}
          {data?.items.length === 0 && (
            <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
              該当する事件が見つかりませんでした
            </p>
          )}
          {data && <Pagination skip={skip} limit={LIMIT} total={data.total} onChange={setSkip} />}
        </>
      )}
    </div>
  )
}
