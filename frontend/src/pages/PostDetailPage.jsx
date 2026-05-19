import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import PostCard from '../components/PostCard'

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost]     = useState(null)
  const [parent, setParent] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const p = await api.getPost(Number(postId))
      setPost(p)
      if (p.reply_to_id) {
        const par = await api.getPost(p.reply_to_id).catch(() => null)
        setParent(par)
      } else {
        setParent(null)
      }
    } catch {
      setPost(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [postId])

  async function handleReact(id, reaction) {
    if (!user) return alert('ログインが必要です')
    try { await api.reactToPost(id, { reaction }); load() } catch (e) { alert(e.message) }
  }

  async function handleReactRepost(id, reaction) {
    if (!user) return alert('ログインが必要です')
    try { await api.reactToRepost(id, { reaction }); load() } catch (e) { alert(e.message) }
  }

  async function handleDelete(id, type = 'post') {
    if (!confirm('削除しますか？')) return
    if (type === 'repost') {
      await api.deleteRepost(id)
    } else {
      await api.deletePost(id)
    }
    navigate(-1)
  }

  if (loading) return <div className="container"><div className="loading">読み込み中...</div></div>
  if (!post)   return <div className="container" style={{ maxWidth: 640 }}><p className="muted" style={{ padding: '3rem', textAlign: 'center' }}>投稿が見つかりません</p></div>

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: '1rem' }}
        onClick={() => navigate(-1)}
      >← 戻る</button>

      {parent && (
        <div style={{ opacity: 0.8 }}>
          <p style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>↩ 返信元の投稿</p>
          <PostCard post={parent} user={user} onReact={handleReact} onReactRepost={handleReactRepost} onDelete={handleDelete} />
        </div>
      )}

      <PostCard post={post} user={user} onReact={handleReact} onReactRepost={handleReactRepost} onDelete={handleDelete} onReplied={load} />
    </div>
  )
}
