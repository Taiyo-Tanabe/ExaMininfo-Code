import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import Pagination from '../components/Pagination'
import PostCard, { Avatar, ComposeArea, RepostCard } from '../components/PostCard'

const LIMIT = 10

function Stars({ n }) {
  return <span style={{ color: '#fbbf24', fontSize: '1rem' }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

function fmtDate(d) { return new Date(d).toLocaleDateString('ja-JP') }

function UserIncidentsTab({ uid }) {
  const [data, setData] = useState(null)
  const [skip, setSkip] = useState(0)
  useEffect(() => {
    api.getIncidents({ user_id: uid, sort_by: 'created_at', order: 'desc', skip, limit: LIMIT }).then(setData)
  }, [uid, skip])

  return (
    <div>
      {data?.items.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>事件の投稿がありません</p>
      )}
      {data?.items.map(inc => (
        <div key={inc.id} className="card" style={{ marginBottom: '0.5rem' }}>
          <p style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{inc.title}</p>
          {inc.course_name && <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>📚 {inc.course_name}</p>}
          {inc.description && <p className="muted" style={{ fontSize: '0.85rem' }}>{inc.description}</p>}
          <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.4rem' }}>{fmtDate(inc.created_at)}</p>
        </div>
      ))}
      {data && <Pagination skip={skip} limit={LIMIT} total={data.total} onChange={setSkip} />}
    </div>
  )
}

function UserReviewsTab({ uid }) {
  const [data, setData] = useState(null)
  const [skip, setSkip] = useState(0)
  useEffect(() => {
    api.getUserReviews(uid, { skip, limit: LIMIT }).then(setData)
  }, [uid, skip])

  return (
    <div>
      {data?.items.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>評価がありません</p>
      )}
      {data?.items.map(rv => (
        <div key={rv.id} className="card" style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <Stars n={rv.rating} />
            <span className="muted" style={{ fontSize: '0.78rem', marginLeft: 'auto' }}>{fmtDate(rv.created_at)}</span>
          </div>
          {rv.comment && <p style={{ fontSize: '0.875rem' }}>{rv.comment}</p>}
        </div>
      ))}
      {data && <Pagination skip={skip} limit={LIMIT} total={data.total} onChange={setSkip} />}
    </div>
  )
}

// Modal for followers / following list
function UserListModal({ title, fetchFn, onClose }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip]   = useState(0)
  const [loading, setLoading] = useState(true)
  const PER = 20

  useEffect(() => {
    setLoading(true)
    fetchFn(skip, PER).then(d => {
      setItems(d.items)
      setTotal(d.total)
    }).finally(() => setLoading(false))
  }, [skip])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>{title}</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading" style={{ padding: '2rem' }}>読み込み中...</div>
          ) : items.length === 0 ? (
            <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>いません</p>
          ) : (
            items.map(u => (
              <Link key={u.id} to={`/users/${u.id}`} className="user-row" onClick={onClose}>
                <Avatar name={u.name} avatarUrl={u.avatar_url} size={36} />
                <div>
                  <div className="user-row-name">{u.name}</div>
                  {u.bio && <div className="user-row-bio">{u.bio}</div>}
                </div>
              </Link>
            ))
          )}
          {total > PER && (
            <Pagination skip={skip} limit={PER} total={total} onChange={setSkip} />
          )}
        </div>
      </div>
    </div>
  )
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const { user: me } = useAuth()
  const [profile, setProfile]         = useState(null)
  const [posts, setPosts]             = useState(null)
  const [reposts, setReposts]         = useState(null)
  const [allActivity, setAllActivity] = useState(null)
  const [tab, setTab]                 = useState('all') // 'all' | 'posts' | 'replies' | 'reposts'
  const [skip, setSkip]               = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(null) // 'followers' | 'following' | null

  const uid = Number(userId)

  useEffect(() => {
    setLoading(true)
    api.getUserProfile(uid)
      .then(setProfile)
      .finally(() => setLoading(false))
  }, [uid])

  useEffect(() => {
    if (me && me.id !== uid) {
      api.getFollowStatus(uid).then(s => setIsFollowing(s.is_following)).catch(() => {})
    }
  }, [uid, me])

  const loadPosts = useCallback(() => {
    if (tab === 'all') {
      Promise.all([
        api.getPosts({ user_id: uid, sort_by: 'created_at', order: 'desc', limit: 50 }),
        api.getAllReposts({ user_id: uid, sort_by: 'created_at', order: 'desc', limit: 50 }),
      ]).then(([postsData, repostsData]) => {
        const combined = [
          ...postsData.items.map(p => ({ kind: 'post',   data: p, ts: p.created_at })),
          ...repostsData.items.map(r => ({ kind: 'repost', data: r, ts: r.created_at })),
        ].sort((a, b) => new Date(b.ts) - new Date(a.ts))
        setAllActivity(combined)
      })
    } else if (tab === 'posts') {
      api.getPosts({ user_id: uid, sort_by: 'created_at', order: 'desc', skip, limit: LIMIT, top_level_only: true })
        .then(setPosts)
    } else if (tab === 'replies') {
      api.getPosts({ user_id: uid, sort_by: 'created_at', order: 'desc', skip, limit: LIMIT, replies_only: true })
        .then(setPosts)
    } else if (tab === 'reposts') {
      api.getAllReposts({ user_id: uid, sort_by: 'created_at', order: 'desc', skip, limit: LIMIT })
        .then(setReposts)
    }
  }, [uid, skip, tab])

  async function handleReact(postId, reaction) {
    if (!me) return alert('ログインが必要です')
    await api.reactToPost(postId, { reaction })
    loadPosts()
  }

  async function handleReactRepost(repostId, reaction) {
    if (!me) return alert('ログインが必要です')
    try { await api.reactToRepost(repostId, { reaction }); loadPosts() } catch (e) { alert(e.message) }
  }

  async function handleDelete(id, type = 'post') {
    if (!confirm('削除しますか？')) return
    if (type === 'repost') {
      await api.deleteRepost(id)
    } else {
      await api.deletePost(id)
    }
    loadPosts()
  }

  useEffect(() => { setSkip(0) }, [tab])
  useEffect(() => { loadPosts() }, [loadPosts])

  async function handleFollow() {
    if (!me) return
    setFollowLoading(true)
    try {
      if (isFollowing) {
        await api.unfollowUser(uid)
        setIsFollowing(false)
        setProfile(p => ({ ...p, follower_count: p.follower_count - 1 }))
      } else {
        await api.followUser(uid)
        setIsFollowing(true)
        setProfile(p => ({ ...p, follower_count: p.follower_count + 1 }))
      }
    } catch (e) {
      alert(e.message)
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) return <div className="container"><div className="loading">読み込み中...</div></div>
  if (!profile) return <div className="container"><p className="muted">ユーザーが見つかりません</p></div>

  const isOwnProfile = me && me.id === uid

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <Avatar name={profile.name} avatarUrl={profile.avatar_url} positionX={profile.avatar_position_x} positionY={profile.avatar_position_y} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.2rem' }}>{profile.name}</p>
            {profile.bio && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.6rem', whiteSpace: 'pre-wrap' }}>
                {profile.bio}
              </p>
            )}
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem' }}>
              <button
                className="profile-stat"
                onClick={() => setModal('followers')}
              >
                <strong>{profile.follower_count}</strong> フォロワー
              </button>
              <button
                className="profile-stat"
                onClick={() => setModal('following')}
              >
                <strong>{profile.following_count}</strong> フォロー中
              </button>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            {me && !isOwnProfile && (
              <button
                className={isFollowing ? 'btn btn-following' : 'btn btn-follow'}
                style={{ minWidth: 104 }}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? '...' : isFollowing ? 'フォロー中' : 'フォローする'}
              </button>
            )}
            {isOwnProfile && (
              <Link to="/account" className="btn btn-secondary" style={{ minWidth: 100, textAlign: 'center' }}>
                編集
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        <div className={`tab ${tab === 'all'       ? 'active' : ''}`} onClick={() => setTab('all')}>すべて</div>
        <div className={`tab ${tab === 'posts'     ? 'active' : ''}`} onClick={() => setTab('posts')}>投稿</div>
        <div className={`tab ${tab === 'replies'   ? 'active' : ''}`} onClick={() => setTab('replies')}>返信</div>
        <div className={`tab ${tab === 'reposts'   ? 'active' : ''}`} onClick={() => setTab('reposts')}>リポスト</div>
        <div className={`tab ${tab === 'incidents' ? 'active' : ''}`} onClick={() => setTab('incidents')}>事件</div>
        <div className={`tab ${tab === 'reviews'   ? 'active' : ''}`} onClick={() => setTab('reviews')}>評価</div>
      </div>

      {isOwnProfile && (tab === 'posts' || tab === 'all') && <ComposeArea user={me} onPosted={loadPosts} />}

      {/* すべてタブ（投稿＋リポスト混合） */}
      {tab === 'all' && (
        <>
          {allActivity?.length === 0 && (
            <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>活動がありません</p>
          )}
          {allActivity?.map(item =>
            item.kind === 'post'
              ? <PostCard key={`p${item.data.id}`} post={item.data} user={me} onReact={handleReact} onReactRepost={handleReactRepost} onDelete={handleDelete} onReplied={loadPosts} />
              : <RepostCard key={`r${item.data.id}`} repost={item.data} user={me} onReact={handleReact} onReactRepost={handleReactRepost} onDelete={handleDelete} onReplied={loadPosts} />
          )}
        </>
      )}

      {/* 投稿・返信タブ */}
      {(tab === 'posts' || tab === 'replies') && (
        <>
          {posts?.items.length === 0 && (
            <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
              {tab === 'replies' ? '返信がありません' : '投稿がありません'}
            </p>
          )}
          {posts?.items.map(post => (
            <PostCard key={post.id} post={post} user={me} onReact={handleReact} onReactRepost={handleReactRepost} onDelete={handleDelete} onReplied={loadPosts} />
          ))}
          {posts && <Pagination skip={skip} limit={LIMIT} total={posts.total} onChange={setSkip} />}
        </>
      )}

      {/* リポストタブ */}
      {tab === 'reposts' && (
        <>
          {reposts?.items.length === 0 && (
            <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>リポストがありません</p>
          )}
          {reposts?.items.map(rp => (
            <RepostCard key={rp.id} repost={rp} user={me} onReact={handleReact} onReactRepost={handleReactRepost} onDelete={handleDelete} onReplied={loadPosts} />
          ))}
          {reposts && <Pagination skip={skip} limit={LIMIT} total={reposts.total} onChange={setSkip} />}
        </>
      )}

      {tab === 'incidents' && <UserIncidentsTab uid={uid} />}
      {tab === 'reviews'   && <UserReviewsTab   uid={uid} />}

      {modal === 'followers' && (
        <UserListModal
          title="フォロワー"
          fetchFn={(s, l) => api.getFollowers(uid, { skip: s, limit: l })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'following' && (
        <UserListModal
          title="フォロー中"
          fetchFn={(s, l) => api.getFollowing(uid, { skip: s, limit: l })}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
