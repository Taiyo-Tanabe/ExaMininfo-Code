import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'

const AVATAR_COLORS = [
  ['#29B6F6','#0288D1'],['#66BB6A','#2E7D32'],['#AB47BC','#6A1B9A'],
  ['#FF7043','#BF360C'],['#26C6DA','#00838F'],['#EC407A','#880E4F'],
]
function Avatar({ name, url, posX = 50, posY = 50, size = 28 }) {
  const [bg, fg] = AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
  if (url) return (
    <img src={url} alt={name} style={{
      width: size, height: size, borderRadius: '50%',
      objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, flexShrink: 0,
    }} />
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${bg}, ${fg})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 800, color: '#fff', flexShrink: 0,
    }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

function RoleBadge({ role }) {
  if (role === 'creator') return <span className="badge" style={{ background: 'rgba(33,150,243,0.15)', color: '#0277bd', fontSize: '0.72rem' }}>作成者</span>
  if (role === 'admin')   return <span className="badge" style={{ background: 'rgba(102,187,106,0.2)', color: '#2e7d32', fontSize: '0.72rem' }}>管理者</span>
  return null
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function OrgDetailPage() {
  const { orgId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [org, setOrg] = useState(null)
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])   // 承認済みメンバーのみ
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [personalInfo, setPersonalInfo] = useState('')

  async function loadAll() {
    const [o, ev, mb] = await Promise.all([
      api.getOrg(orgId),
      api.getEvents({ org_id: orgId, limit: 100 }),
      api.getOrgMembers(orgId, 'approved'),
    ])
    setOrg(o); setEvents(ev.items); setMembers(mb)
  }

  useEffect(() => {
    loadAll().catch(() => {}).finally(() => setLoading(false))
  }, [orgId])

  async function handleDelete() {
    if (!confirm(`「${org.name}」を削除しますか？イベントもすべて削除されます。`)) return
    try { await api.deleteOrg(orgId); navigate('/orgs') }
    catch (e) { alert(e.message) }
  }

  async function handleJoin() {
    setJoining(true)
    try {
      await api.joinOrg(orgId, { personal_info: personalInfo.trim() || null })
      const o = await api.getOrg(orgId)
      setOrg(o)
      setShowJoinForm(false)
      setPersonalInfo('')
    } catch (e) { alert(e.message) }
    finally { setJoining(false) }
  }

  async function handleLeave() {
    if (!confirm('この団体を退会しますか？')) return
    setJoining(true)
    try {
      await api.leaveOrg(orgId)
      const [o, mb] = await Promise.all([api.getOrg(orgId), api.getOrgMembers(orgId, 'approved')])
      setOrg(o); setMembers(mb)
    } catch (e) { alert(e.message) }
    finally { setJoining(false) }
  }

  if (loading) return <div className="container"><div className="loading">読み込み中...</div></div>
  if (!org) return <div className="container"><p className="muted">団体が見つかりません</p></div>

  const isCreator = user && user.id === org.created_by
  const myRole = org.my_role  // "creator" | "admin" | "member" | "pending" | null
  const isMember = myRole === 'member' || myRole === 'admin'
  const canManage = isCreator || myRole === 'admin'

  return (
    <div className="container" style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/orgs" className="muted" style={{ fontSize: '0.9rem', textDecoration: 'none' }}>← 団体一覧</Link>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Avatar name={org.name} url={org.icon_url} posX={org.icon_position_x} posY={org.icon_position_y} size={56} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{org.name}</h1>
              <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                メンバー {org.member_count + 1}人　イベント {org.event_count}件
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
            {canManage && (
              <>
                {isCreator && <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/orgs/${orgId}/edit`)}>編集</button>}
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/orgs/${orgId}/dashboard`)}>管理</button>
                {isCreator && <button className="btn btn-sm" style={{ background: 'rgba(239,83,80,0.15)', color: '#c62828' }} onClick={handleDelete}>削除</button>}
              </>
            )}
            {user && myRole === null && !showJoinForm && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowJoinForm(true)}>
                加入申請する
              </button>
            )}
            {user && myRole === 'pending' && (
              <span className="badge" style={{ background: 'rgba(255,193,7,0.2)', color: '#856404' }}>承認待ち</span>
            )}
            {user && isMember && (
              <button className="btn btn-secondary btn-sm" style={{ color: '#c62828' }} onClick={handleLeave} disabled={joining}>
                {joining ? '処理中...' : '退会する'}
              </button>
            )}
          </div>
        </div>
        {org.description && <p style={{ marginTop: '1rem', lineHeight: 1.7 }}>{org.description}</p>}
        {user && myRole === null && showJoinForm && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>加入申請</p>
            {org.personal_info_prompt && (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{org.personal_info_prompt}</p>
            )}
            <textarea
              className="input"
              style={{ width: '100%', boxSizing: 'border-box', minHeight: 80, resize: 'vertical', marginBottom: '0.75rem' }}
              placeholder={org.personal_info_prompt ? '上記の情報を入力してください' : '本人確認のための情報を入力してください（学年・学籍番号など）'}
              value={personalInfo}
              onChange={e => setPersonalInfo(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={handleJoin} disabled={joining}>
                {joining ? '送信中...' : '申請する'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowJoinForm(false); setPersonalInfo('') }}>
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>

      {/* イベント一覧 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>イベント</h2>
        {canManage && (
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/events/new?org_id=${orgId}`)}>
            + イベント追加
          </button>
        )}
      </div>

      {events.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>イベントがまだありません</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        {events.map(ev => (
          <Link key={ev.id} to={`/events/${ev.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>{ev.title}</p>
                  <p className="muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                    📅 {formatDate(ev.start_at)}{ev.location ? `　📍 ${ev.location}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                  {ev.requires_view_approval && <span className="badge" style={{ fontSize: '0.75rem' }}>閲覧承認が必要</span>}
                  {ev.requires_join_approval && <span className="badge" style={{ fontSize: '0.75rem' }}>参加承認が必要</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* メンバー一覧（自分がメンバーのときのみ表示） */}
      {(isCreator || isMember) && (
        <>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>メンバー</h2>
          <div className="card" style={{ padding: '0.5rem 1rem' }}>
            <Link to={`/users/${org.created_by}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: members.length > 0 ? '1px solid var(--border)' : 'none', textDecoration: 'none', color: 'inherit' }}>
              <Avatar name={org.creator_name} url={org.creator_avatar_url} posX={org.creator_avatar_position_x} posY={org.creator_avatar_position_y} size={28} />
              <span style={{ fontWeight: 500 }}>{org.creator_name}</span>
            </Link>
            {members.map((m, i) => (
              <Link key={m.id} to={`/users/${m.user_id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none', textDecoration: 'none', color: 'inherit' }}>
                <Avatar name={m.user_name} url={m.user_avatar_url} posX={m.user_avatar_position_x} posY={m.user_avatar_position_y} size={28} />
                <span style={{ fontWeight: 500 }}>{m.user_name}</span>
                {m.role === 'admin' && <RoleBadge role="admin" />}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
