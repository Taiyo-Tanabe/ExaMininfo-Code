import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import CourseSelect from './CourseSelect'
import SchoolAutocomplete from './SchoolAutocomplete'

const AVATAR_COLORS = [
  ['#29B6F6','#0288D1'], ['#66BB6A','#2E7D32'], ['#AB47BC','#6A1B9A'],
  ['#FF7043','#BF360C'], ['#26C6DA','#00838F'], ['#EC407A','#880E4F'],
]

export function Avatar({ name, avatarUrl, positionX = 50, positionY = 50, size = 40, style = {} }) {
  const [bg, fg] = AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
  const [imgError, setImgError] = useState(false)
  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="post-avatar"
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, objectFit: 'cover', borderRadius: '50%',
          objectPosition: `${positionX}% ${positionY}%`,
          ...style,
        }}
      />
    )
  }
  return (
    <div
      className="post-avatar"
      style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${bg}, ${fg})`,
        fontSize: size * 0.4, ...style,
      }}
    >
      {(name ?? '?')[0].toUpperCase()}
    </div>
  )
}

function fmt(d) {
  const dt = new Date(d), now = new Date(), diff = (now - dt) / 1000
  if (diff < 60)    return `${Math.floor(diff)}秒`
  if (diff < 3600)  return `${Math.floor(diff / 60)}分`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間`
  return dt.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export function renderContent(content) {
  if (!content) return null
  return content.split(/(@\S+)/g).map((part, i) =>
    /^@\S+$/.test(part)
      ? (
        <Link
          key={i}
          to={`/users/by-name/${encodeURIComponent(part.slice(1))}`}
          style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
          onClick={e => e.stopPropagation()}
        >
          {part}
        </Link>
      )
      : part
  )
}

export function MentionTextarea({ value, onChange, placeholder, rows, className, style }) {
  const ref = useRef(null)
  const [results, setResults] = useState([])
  const [mentionStart, setMentionStart] = useState(-1)

  function handleChange(e) {
    const val = e.target.value
    const cursor = e.target.selectionStart
    const match = val.slice(0, cursor).match(/@([^\s@]*)$/)
    if (match) {
      setMentionStart(cursor - match[1].length - 1)
      api.searchUsers(match[1]).then(d => setResults(d.items)).catch(() => setResults([]))
    } else {
      setResults([])
      setMentionStart(-1)
    }
    onChange(val)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setResults([]); setMentionStart(-1) }
  }

  function selectMention(user) {
    const cursor = ref.current?.selectionStart ?? value.length
    const before = value.slice(0, mentionStart)
    const after = value.slice(cursor)
    const inserted = `@${user.name} `
    onChange(before + inserted + after)
    setResults([])
    setMentionStart(-1)
    setTimeout(() => {
      const pos = before.length + inserted.length
      ref.current?.setSelectionRange(pos, pos)
      ref.current?.focus()
    }, 0)
  }

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
        style={style}
      />
      {results.length > 0 && (
        <div className="mention-dropdown">
          {results.map(u => (
            <div
              key={u.id}
              className="mention-item"
              onMouseDown={e => { e.preventDefault(); selectMention(u) }}
            >
              <Avatar name={u.name} avatarUrl={u.avatar_url} size={22} />
              <span style={{ fontWeight: 600 }}>@{u.name}</span>
              {u.bio && <span style={{ color: 'var(--muted)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 投稿コンポーズエリア（新規ポスト用） ──
export function ComposeArea({ user, onPosted, fixedSchoolId = null, fixedSchoolName = null }) {
  const [content, setContent]       = useState('')
  const [schools, setSchools]       = useState([])
  const [schoolId, setSchoolId]     = useState(fixedSchoolId)
  const [courseName, setCourseName] = useState('')
  const [error, setError]           = useState('')
  const [posting, setPosting]       = useState(false)

  useEffect(() => {
    if (!fixedSchoolId) api.getSchools({ limit: 1000 }).then(d => setSchools(d.items))
  }, [fixedSchoolId])

  async function handleCreate() {
    if (!content.trim()) { setError('内容を入力してください'); return }
    if (!schoolId)        { setError('大学を選択してください'); return }
    setPosting(true); setError('')
    try {
      await api.createPost({
        school_id: Number(schoolId),
        content: content.trim(),
        course_name: courseName || null,
      })
      setContent(''); if (!fixedSchoolId) { setSchoolId(null) } setCourseName('')
      onPosted?.()
    } catch (e) { setError(e.message) }
    finally { setPosting(false) }
  }

  return (
    <div className="card" style={{ padding: 0, marginBottom: '1rem', overflow: 'visible' }}>
      <div className="compose-area">
        <Avatar name={user.name} avatarUrl={user.avatar_url} positionX={user.avatar_position_x} positionY={user.avatar_position_y} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {fixedSchoolId ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.25rem', fontWeight: 600 }}>🏫 {fixedSchoolName}</p>
          ) : (
            <SchoolAutocomplete
              schools={schools}
              schoolId={schoolId}
              onSelect={setSchoolId}
              placeholder="投稿する大学を選択"
            />
          )}
          <CourseSelect schoolId={schoolId} value={courseName} onChange={setCourseName} />
          <MentionTextarea
            className="compose-textarea"
            style={{ marginTop: '0.5rem' }}
            placeholder="いまどうしてる？ (@でメンション)"
            value={content}
            onChange={setContent}
            rows={2}
          />
        </div>
      </div>
      <div className="compose-footer">
        {error && <span className="error" style={{ marginRight: 'auto' }}>{error}</span>}
        <button
          className="btn btn-primary btn-sm"
          onClick={handleCreate}
          disabled={posting || !content.trim()}
        >
          {posting ? '投稿中...' : '投稿する'}
        </button>
      </div>
    </div>
  )
}

// ── リプライスレッド（depth=1 の PostCard を使用） ──
function ReplyThread({ postId, user, onReact, onDelete }) {
  const [replies, setReplies] = useState(null)
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    api.getPosts({ reply_to_id: postId, sort_by: 'created_at', order: 'asc', limit: 20 })
      .then(d => setReplies(d.items))
  }, [postId, tick])

  if (!replies || replies.length === 0) return null

  return (
    <div>
      {replies.map(r => (
        <PostCard
          key={r.id}
          post={r}
          user={user}
          onReact={onReact}
          onDelete={onDelete}
          onReplied={() => setTick(t => t + 1)}
          depth={1}
        />
      ))}
    </div>
  )
}

// ── リポストカード ──
export function RepostCard({ repost, user, onReact, onReactRepost, onDelete, onReplied }) {
  const post = repost.original_post
  const isOwn = user && user.id === repost.user_id
  const isNotOwnRepost = user && user.id !== repost.user_id
  const [mode, setMode]                 = useState(null) // null | 'reply' | 'quote'
  const [editing, setEditing]           = useState(false)
  const [editComment, setEditComment]   = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [comment, setComment]           = useState('')
  const [submitting, setSubmitting]     = useState(false)

  async function handleRepost() {
    if (!user) return alert('ログインが必要です')
    setSubmitting(true)
    try { await api.createRepost(repost.post_id, { comment: null }); alert('リポストしました') }
    finally { setSubmitting(false) }
  }

  async function handleQuote() {
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      await api.createRepost(repost.post_id, { comment: comment.trim() })
      setComment(''); setMode(null)
      onReplied?.()
    } finally { setSubmitting(false) }
  }

  async function handleReply() {
    if (!replyContent.trim() || !post) return
    setSubmitting(true)
    try {
      await api.createPost({
        school_id: post.school_id,
        content: replyContent.trim(),
        reply_to_id: post.id,
      })
      setReplyContent(''); setMode(null)
      onReplied?.()
    } finally { setSubmitting(false) }
  }

  async function handleSaveEdit() {
    setSubmitting(true)
    try {
      await api.updateRepost(repost.id, { comment: editComment.trim() || null })
      setEditing(false)
      onReplied?.()
    } catch (e) { alert(e.message) }
    finally { setSubmitting(false) }
  }

  return (
    <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', marginBottom: '0.5rem', overflow: 'hidden' }}>
      {/* ヘッダー */}
      <div style={{ padding: '0.5rem 1rem 0.1rem', fontSize: '0.76rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <span style={{ color: 'var(--primary)' }}>🔁</span>
        <Link to={`/users/${repost.user_id}`} style={{ fontWeight: 600, color: 'var(--muted)', textDecoration: 'none' }}>
          {repost.user_name}
        </Link>
        {repost.comment ? 'が引用リポスト' : 'がリポスト'}
        <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{fmt(repost.created_at)}</span>
      </div>
      {/* コメント（引用リポスト） — 編集中はフォームを表示 */}
      {editing ? (
        <div style={{ padding: '0.4rem 1rem 0.5rem' }}>
          <MentionTextarea
            value={editComment}
            onChange={setEditComment}
            placeholder="コメントを編集... (@でメンション)"
            rows={2}
            style={{
              width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', outline: 'none',
              color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.9rem',
              resize: 'none', padding: '0.4rem 0.5rem', minHeight: 56,
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>キャンセル</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveEdit}
              disabled={submitting}
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      ) : (
        repost.comment && (
          <div style={{ padding: '0.3rem 1rem 0.1rem', fontSize: '0.875rem' }}>
            {renderContent(repost.comment)}
          </div>
        )
      )}
      {/* 元の投稿 */}
      {post
        ? <PostCard post={post} user={user} onReact={onReact} onDelete={onDelete} onReplied={onReplied} depth={2} />
        : <p style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>元の投稿は削除されました</p>
      }
      {/* リポスト自体へのアクション */}
      <div className="post-actions" style={{ borderTop: '1px solid var(--border-soft)', padding: '0.35rem 1rem', position: 'relative' }}>
        {isNotOwnRepost && (
          <>
            <button className="post-action-btn like-btn" onClick={() => onReactRepost?.(repost.id, 'like')}>
              👍 {repost.like_count || ''}
            </button>
            <button className="post-action-btn dislike-btn" onClick={() => onReactRepost?.(repost.id, 'dislike')}>
              👎 {repost.dislike_count || ''}
            </button>
          </>
        )}
        {user && post && (
          <button
            className="post-action-btn reply-btn"
            onClick={() => setMode(m => m === 'reply' ? null : 'reply')}
          >💬</button>
        )}
        {user && post && user.id !== post.user_id && (
          <>
            <button className="post-action-btn repost-btn" onClick={handleRepost} disabled={submitting}>🔁</button>
            <button
              className="post-action-btn quote-btn"
              onClick={() => setMode(m => m === 'quote' ? null : 'quote')}
            >「」</button>
          </>
        )}
        {post && (
          <Link
            to={`/posts/${post.id}`}
            className="post-action-btn"
            style={{ textDecoration: 'none', fontSize: '0.76rem', color: 'var(--muted)' }}
          >
            🔗
          </Link>
        )}
        {user && (isOwn || user.role === 'admin') && !editing && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
            {isOwn && (
              <button
                className="post-action-btn"
                style={{ fontSize: '0.76rem' }}
                onClick={() => { setEditComment(repost.comment || ''); setEditing(true); setMode(null) }}
              >✏️</button>
            )}
            <button
              className="post-action-btn delete-btn"
              onClick={() => onDelete?.(repost.id, 'repost')}
            >🗑</button>
          </div>
        )}
        {user && !isOwn && (
          <ReportButton user={user} targetType="repost" targetId={repost.id} />
        )}
      </div>

      {/* リプライフォーム */}
      {mode === 'reply' && user && post && (
        <div className="reply-box" style={{ margin: '0 1rem 0.75rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
            <strong style={{ color: 'var(--text-dim)' }}>{post.user_name}</strong> にリプライ
          </div>
          <MentionTextarea
            value={replyContent}
            onChange={setReplyContent}
            placeholder="リプライを入力... (@でメンション)"
            rows={2}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.9rem',
              resize: 'none', marginTop: '0.4rem', minHeight: 60,
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>キャンセル</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleReply}
              disabled={submitting || !replyContent.trim()}
            >
              {submitting ? '送信中...' : 'リプライ'}
            </button>
          </div>
        </div>
      )}

      {/* 引用フォーム */}
      {mode === 'quote' && user && post && (
        <div className="reply-box" style={{ margin: '0 1rem 0.75rem' }}>
          <div className="quote-preview">
            <strong>{post.user_name}</strong>：{post.content.slice(0, 80)}{post.content.length > 80 ? '…' : ''}
          </div>
          <MentionTextarea
            value={comment}
            onChange={setComment}
            placeholder="コメントを追加... (@でメンション)"
            rows={2}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.9rem',
              resize: 'none', minHeight: 50,
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>キャンセル</button>
            <button className="btn btn-primary btn-sm" onClick={handleQuote} disabled={submitting}>
              {submitting ? '送信中...' : '引用ポスト'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 通報ボタン ──
function ReportButton({ user, targetType, targetId }) {
  const [open, setOpen]       = useState(false)
  const [reason, setReason]   = useState('')
  const [sending, setSending] = useState(false)

  if (!user) return null

  async function handleReport() {
    setSending(true)
    try {
      await api.createReport({ target_type: targetType, target_id: targetId, reason: reason || null })
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
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '1.25rem', width: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>この投稿を通報</p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="理由（任意）"
              rows={3}
              style={{ width: '100%', fontSize: '0.82rem', resize: 'none', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.3rem 0.4rem', color: 'var(--text)', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>キャンセル</button>
              <button className="btn btn-primary btn-sm" onClick={handleReport} disabled={sending}>
                {sending ? '送信中...' : '送信'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── メイン PostCard ──
export default function PostCard({ post, user, onReact, onReactRepost, onDelete, onReplied, depth = 0 }) {
  const [mode, setMode]               = useState(null) // null | 'reply' | 'quote'
  const [showReplies, setShowReplies] = useState(false)
  const [repostList, setRepostList]   = useState(null)
  const [showReposts, setShowReposts] = useState(false)
  const [comment, setComment]         = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [editing, setEditing]         = useState(false)
  const [editContent, setEditContent] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [editingRepostId, setEditingRepostId]         = useState(null)
  const [editingRepostComment, setEditingRepostComment] = useState('')
  const isOwn = user && user.id === post.user_id

  async function handleSaveRepostEdit(rpId) {
    await api.updateRepost(rpId, { comment: editingRepostComment.trim() || null })
    setEditingRepostId(null)
    const d = await api.getReposts(post.id, { limit: 30 })
    setRepostList(d)
  }

  async function handleDeleteRepost(rpId) {
    if (!confirm('このリポストを削除しますか？')) return
    await api.deleteRepost(rpId)
    const d = await api.getReposts(post.id, { limit: 30 })
    setRepostList(d)
    onReplied?.()
  }

  async function handleRepost() {
    if (!user) return alert('ログインが必要です')
    setSubmitting(true)
    try { await api.createRepost(post.id, { comment: null }); alert('リポストしました') }
    finally { setSubmitting(false) }
  }

  async function handleQuote() {
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      await api.createRepost(post.id, { comment: comment.trim() })
      setComment(''); setMode(null)
    } finally { setSubmitting(false) }
  }

  async function handleReply() {
    if (!replyContent.trim()) return
    setSubmitting(true)
    try {
      await api.createPost({
        school_id: post.school_id,
        content: replyContent.trim(),
        reply_to_id: post.id,
      })
      setReplyContent(''); setMode(null)
      setShowReplies(true)
      onReplied?.()
    } finally { setSubmitting(false) }
  }

  async function handleSaveEdit() {
    if (!editContent.trim()) return
    setSubmitting(true)
    try {
      await api.updatePost(post.id, {
        content: editContent.trim(),
        course_name: post.course_name || null,
      })
      setEditing(false)
      onReplied?.()
    } finally { setSubmitting(false) }
  }

  async function toggleReposts() {
    if (!repostList) {
      const d = await api.getReposts(post.id, { limit: 30 })
      setRepostList(d)
    }
    setShowReposts(v => !v)
  }

  const cardStyle = depth === 0
    ? { background: 'var(--card)', borderRadius: 'var(--r-lg)', marginBottom: '0.5rem', overflow: 'hidden' }
    : depth === 1
    ? { background: 'var(--card)', borderLeft: '2px solid var(--border-soft)', marginLeft: '1.5rem', overflow: 'hidden' }
    : { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', margin: '0 1rem 0', overflow: 'hidden' }

  return (
    <div style={cardStyle}>
      {/* ── Main post ── */}
      <div className="post-card">
        <div className="post-avatar-col">
          <Link to={`/users/${post.user_id}`}>
            <Avatar name={post.user_name} avatarUrl={post.user_avatar_url} positionX={post.user_avatar_position_x} positionY={post.user_avatar_position_y} />
          </Link>
          {depth === 0 && showReplies && post.reply_count > 0 && (
            <div className="thread-line" style={{ minHeight: 24 }} />
          )}
        </div>
        <div className="post-body">
          <div className="post-header">
            <Link to={`/users/${post.user_id}`} className="post-author">
              {post.user_name ?? `ユーザー#${post.user_id}`}
            </Link>
            {post.school_name && (
              <><span className="post-dot">·</span>
              <Link to={`/schools/${post.school_id}`} className="post-school">🏫 {post.school_name}</Link></>
            )}
            {post.course_name && (
              <><span className="post-dot">·</span>
              <span className="post-course">📚 {post.course_name}</span></>
            )}
            <span className="post-time">{fmt(post.created_at)}</span>
          </div>

          {post.reply_to_id && (
            <Link to={`/posts/${post.reply_to_id}`} className="post-reply-label" onClick={e => e.stopPropagation()} style={{ textDecoration: 'none' }}>
              ↩ リプライ元を見る
            </Link>
          )}

          {/* 編集モード or 表示モード */}
          {editing ? (
            <div style={{ marginTop: '0.4rem' }}>
              <MentionTextarea
                value={editContent}
                onChange={setEditContent}
                rows={3}
                style={{
                  width: '100%', background: 'transparent',
                  border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                  outline: 'none', color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: '0.9rem', resize: 'none', padding: '0.4rem 0.5rem', minHeight: 70,
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>キャンセル</button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveEdit}
                  disabled={submitting || !editContent.trim()}
                >
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          ) : (
            <div className="post-content">{renderContent(post.content)}</div>
          )}

          <div className="post-actions" style={{ position: 'relative' }}>
            <button className="post-action-btn like-btn" onClick={() => onReact?.(post.id, 'like')}>
              👍 {post.like_count || ''}
            </button>
            <button className="post-action-btn dislike-btn" onClick={() => onReact?.(post.id, 'dislike')}>
              👎 {post.dislike_count || ''}
            </button>
            {user && (
              <button
                className="post-action-btn reply-btn"
                onClick={() => setMode(m => m === 'reply' ? null : 'reply')}
              >
                💬 {post.reply_count > 0 ? post.reply_count : ''}
              </button>
            )}
            {post.reply_count > 0 && depth === 0 && (
              <button
                className="post-action-btn reply-btn"
                style={{ fontSize: '0.76rem' }}
                onClick={() => setShowReplies(v => !v)}
              >
                {showReplies ? '閉じる' : 'スレッド'}
              </button>
            )}
            {user && !isOwn && (
              <>
                <button className="post-action-btn repost-btn" onClick={handleRepost} disabled={submitting}>🔁</button>
                <button
                  className="post-action-btn quote-btn"
                  onClick={() => setMode(m => m === 'quote' ? null : 'quote')}
                >「」</button>
              </>
            )}
            <button
              className="post-action-btn"
              onClick={toggleReposts}
              style={{ fontSize: '0.76rem', opacity: repostList ? 1 : 0.5, color: 'var(--text-muted)' }}
              title="リポスト一覧を見る"
            >
              👥 {repostList?.total > 0 ? repostList.total : ''}
            </button>
            {user && (isOwn || user.role === 'admin') && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                {isOwn && !editing && (
                  <button
                    className="post-action-btn"
                    style={{ fontSize: '0.76rem' }}
                    onClick={() => { setEditContent(post.content); setEditing(true); setMode(null) }}
                  >✏️</button>
                )}
                <button className="post-action-btn delete-btn" onClick={() => onDelete?.(post.id)}>🗑</button>
              </div>
            )}
            {user && !isOwn && (
              <ReportButton user={user} targetType="post" targetId={post.id} />
            )}
          </div>
        </div>
      </div>

      {/* ── リプライフォーム（コース欄なし） ── */}
      {mode === 'reply' && user && (
        <div className="reply-box" style={{ margin: '0 1rem 0.75rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
            <strong style={{ color: 'var(--text-dim)' }}>{post.user_name}</strong> にリプライ
          </div>
          <MentionTextarea
            value={replyContent}
            onChange={setReplyContent}
            placeholder="リプライを入力... (@でメンション)"
            rows={2}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.9rem',
              resize: 'none', marginTop: '0.4rem', minHeight: 60,
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>キャンセル</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleReply}
              disabled={submitting || !replyContent.trim()}
            >
              {submitting ? '送信中...' : 'リプライ'}
            </button>
          </div>
        </div>
      )}

      {/* ── 引用フォーム（コース欄なし） ── */}
      {mode === 'quote' && user && (
        <div className="reply-box" style={{ margin: '0 1rem 0.75rem' }}>
          <div className="quote-preview">
            <strong>{post.user_name}</strong>：{post.content.slice(0, 80)}{post.content.length > 80 ? '…' : ''}
          </div>
          <MentionTextarea
            value={comment}
            onChange={setComment}
            placeholder="コメントを追加... (@でメンション)"
            rows={2}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.9rem',
              resize: 'none', minHeight: 50,
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>キャンセル</button>
            <button className="btn btn-primary btn-sm" onClick={handleQuote} disabled={submitting}>
              {submitting ? '送信中...' : '引用ポスト'}
            </button>
          </div>
        </div>
      )}

      {/* ── リポスト一覧 ── */}
      {showReposts && repostList && (
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: '0.5rem' }}>
          {repostList.items.length === 0
            ? <p className="muted" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>リポストはまだありません</p>
            : repostList.items.map(rp => {
                const rpIsOwn = user && user.id === rp.user_id
                const rpCanAct = user && (rpIsOwn || user.role === 'admin')
                const isEditingThis = editingRepostId === rp.id
                return (
                  <div key={rp.id} style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--r-md)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Avatar name={rp.user_name} avatarUrl={rp.user_avatar_url} positionX={rp.user_avatar_position_x} positionY={rp.user_avatar_position_y} size={32} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Link to={`/users/${rp.user_id}`} style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text)', textDecoration: 'none' }}>
                          {rp.user_name ?? `#${rp.user_id}`}
                        </Link>
                        {isEditingThis ? (
                          <div style={{ marginTop: '0.3rem' }}>
                            <MentionTextarea
                              value={editingRepostComment}
                              onChange={setEditingRepostComment}
                              placeholder="コメントを編集..."
                              rows={2}
                              style={{
                                width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                                borderRadius: 'var(--r-md)', outline: 'none',
                                color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.85rem',
                                resize: 'none', padding: '0.3rem 0.5rem',
                              }}
                            />
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingRepostId(null)}>キャンセル</button>
                              <button className="btn btn-primary btn-sm" onClick={() => handleSaveRepostEdit(rp.id)}>保存</button>
                            </div>
                          </div>
                        ) : (
                          rp.comment
                            ? <>
                                <div style={{ fontSize: '0.875rem', marginTop: '0.15rem' }}>{renderContent(rp.comment)}</div>
                                <div className="quote-preview" style={{ marginTop: '0.3rem', fontSize: '0.8rem' }}>{post.content.slice(0, 60)}…</div>
                              </>
                            : <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>🔁 リポスト</div>
                        )}
                      </div>
                    </div>
                    <div className="post-actions" style={{ paddingLeft: '2.5rem', marginTop: '0.25rem', position: 'relative' }}>
                      {user && !rpIsOwn && (
                        <>
                          <button className="post-action-btn like-btn" style={{ fontSize: '0.78rem' }} onClick={() => onReactRepost?.(rp.id, 'like')}>
                            👍 {rp.like_count || ''}
                          </button>
                          <button className="post-action-btn dislike-btn" style={{ fontSize: '0.78rem' }} onClick={() => onReactRepost?.(rp.id, 'dislike')}>
                            👎 {rp.dislike_count || ''}
                          </button>
                        </>
                      )}
                      {rpCanAct && !isEditingThis && (
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                          {rpIsOwn && (
                            <button
                              className="post-action-btn"
                              style={{ fontSize: '0.76rem' }}
                              onClick={() => { setEditingRepostId(rp.id); setEditingRepostComment(rp.comment || '') }}
                            >✏️</button>
                          )}
                          <button
                            className="post-action-btn delete-btn"
                            style={{ fontSize: '0.76rem' }}
                            onClick={() => handleDeleteRepost(rp.id)}
                          >🗑</button>
                        </div>
                      )}
                      {user && !rpIsOwn && !isEditingThis && (
                        <ReportButton user={user} targetType="repost" targetId={rp.id} />
                      )}
                    </div>
                  </div>
                )
              })
          }
        </div>
      )}

      {/* ── リプライスレッド（depth=0 のみ） ── */}
      {depth === 0 && showReplies && (
        <div style={{ borderTop: '1px solid var(--border-soft)' }}>
          <ReplyThread postId={post.id} user={user} onReact={onReact} onDelete={onDelete} />
        </div>
      )}
    </div>
  )
}
