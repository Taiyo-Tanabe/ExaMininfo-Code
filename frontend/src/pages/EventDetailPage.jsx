import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'

function formatDate(iso) {
  if (!iso) return '未定'
  return new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const AVATAR_COLORS = [
  ['#29B6F6','#0288D1'],['#66BB6A','#2E7D32'],['#AB47BC','#6A1B9A'],
  ['#FF7043','#BF360C'],['#26C6DA','#00838F'],['#EC407A','#880E4F'],
]
function MiniAvatar({ name, url, posX = 50, posY = 50, size = 28 }) {
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

function ViewRequestBanner({ event, user, onRequest, requesting, canView }) {
  if (!event.requires_view_approval || canView) return null
  const status = event.my_view_request

  if (status === 'pending') return (
    <div style={{ background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.5)', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', color: '#856404' }}>
      閲覧申請中です。団体の承認をお待ちください。
    </div>
  )
  if (status === 'rejected') return (
    <div style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.4)', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', color: '#c62828' }}>
      閲覧申請が拒否されました。
      <button className="btn btn-sm btn-secondary" style={{ marginLeft: '1rem' }} onClick={onRequest} disabled={requesting}>再申請する</button>
    </div>
  )
  if (!user) return (
    <div style={{ background: 'rgba(33,150,243,0.08)', border: '1px solid rgba(33,150,243,0.3)', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', color: '#0277bd' }}>
      このイベントの詳細閲覧にはログインと団体の承認が必要です。
    </div>
  )
  return (
    <div style={{ background: 'rgba(33,150,243,0.08)', border: '1px solid rgba(33,150,243,0.3)', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', color: '#0277bd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
      <span>このイベントの詳細閲覧には団体の承認が必要です。</span>
      <button className="btn btn-primary btn-sm" onClick={onRequest} disabled={requesting}>
        {requesting ? '申請中...' : '閲覧を申請する'}
      </button>
    </div>
  )
}

export default function EventDetailPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [tab, setTab] = useState('attending')
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [note, setNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteEditing, setNoteEditing] = useState(false)

  function loadEvent() { return api.getEvent(eventId).then(e => { setEvent(e); setNote(e.my_note ?? '') }) }
  function loadAttendees(status = tab) { return api.getAttendees(eventId, { status }).then(setAttendees).catch(() => {}) }

  useEffect(() => {
    setLoading(true)
    const loads = [loadEvent()]
    if (user) loads.push(loadAttendees())
    Promise.all(loads).finally(() => setLoading(false))
  }, [eventId, user])

  async function handleAttend(newStatus) {
    try {
      if (event.my_status === newStatus) await api.cancelAttendance(eventId)
      else await api.attendEvent(eventId, newStatus, note || undefined)
      await loadEvent()
      await loadAttendees(tab)
    } catch (e) { alert(e.message) }
  }

  async function handleSaveNote() {
    if (!event.my_status || event.my_status === 'pending') return
    setNoteSaving(true)
    try {
      await api.attendEvent(eventId, event.my_status, note || undefined)
      await loadEvent()
      await loadAttendees(tab)
      setNoteEditing(false)
    } catch (e) { alert(e.message) }
    finally { setNoteSaving(false) }
  }

  async function handleDelete() {
    if (!confirm('このイベントを削除しますか？')) return
    try { await api.deleteEvent(eventId); navigate('/events') }
    catch (e) { alert(e.message) }
  }

  async function handleViewRequest() {
    setRequesting(true)
    try { await api.requestView(eventId); await loadEvent() }
    catch (e) { alert(e.message) }
    finally { setRequesting(false) }
  }

  async function switchTab(status) {
    setTab(status)
    await loadAttendees(status)
  }

  if (loading) return <div className="container"><div className="loading">読み込み中...</div></div>
  if (!event)  return <div className="container"><p className="muted">イベントが見つかりません</p></div>

  const canManage = event.can_manage
  const canView = event.title !== null
  const canJoin = canView && user
  const attendingLabel = event.requires_join_approval ? '参加を申請する' : '参加する'

  if (!canView) return (
    <div className="container" style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/events" className="muted" style={{ fontSize: '0.9rem', textDecoration: 'none' }}>← イベント一覧</Link>
      </div>
      <ViewRequestBanner event={event} user={user} onRequest={handleViewRequest} requesting={requesting} canView={false} />
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        {event.org_name && (
          <Link to={`/orgs/${event.org_id}`} style={{ fontSize: '0.9rem', color: 'var(--primary)', textDecoration: 'none', display: 'block', marginBottom: '0.75rem' }}>
            {event.org_name}
          </Link>
        )}
        <p className="muted">このイベントは非公開です。</p>
        <p className="muted" style={{ fontSize: '0.85rem' }}>団体のメンバーになるか、閲覧申請を行ってください。</p>
      </div>
    </div>
  )

  return (
    <div className="container" style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/events" className="muted" style={{ fontSize: '0.9rem', textDecoration: 'none' }}>← イベント一覧</Link>
      </div>

      <ViewRequestBanner event={event} user={user} onRequest={handleViewRequest} requesting={requesting} canView={canView} />

      {/* イベント詳細カード */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{event.title}</h1>
            {event.org_name && (
              <Link to={`/orgs/${event.org_id}`} style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', display: 'block', marginTop: '0.25rem' }}>
                {event.org_name}
              </Link>
            )}
          </div>
          {canManage && (
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/events/${eventId}/edit`)}>編集</button>
              <button className="btn btn-sm" style={{ background: 'rgba(239,83,80,0.15)', color: '#c62828' }} onClick={handleDelete}>削除</button>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span className="muted" style={{ fontSize: '0.9rem' }}>
            📅 {formatDate(event.start_at)}{event.end_at ? ` 〜 ${formatDate(event.end_at)}` : ''}
          </span>
          {event.location && (
            <span className="muted" style={{ fontSize: '0.9rem' }}>📍 {event.location}</span>
          )}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.15rem' }}>
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              参加者 {event.attendee_count}{event.max_participants ? ` / ${event.max_participants}` : ''} 人
            </span>
            {event.requires_view_approval && <span className="badge">閲覧承認が必要</span>}
            {event.requires_join_approval && <span className="badge">参加承認が必要</span>}
          </div>
        </div>

        {event.description && (
          <p style={{ marginTop: '1rem', whiteSpace: 'pre-line', lineHeight: 1.7 }}>{event.description}</p>
        )}

        {/* 参加ボタン */}
        {canJoin && event.my_status !== 'pending' && (
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
            <button
              className={`btn ${event.my_status === 'attending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleAttend('attending')}
            >
              {event.my_status === 'attending' ? '✓ 参加予定' : attendingLabel}
            </button>
            <button
              className="btn btn-secondary"
              style={event.my_status === 'not_attending' ? { opacity: 0.6 } : {}}
              onClick={() => handleAttend('not_attending')}
            >
              {event.my_status === 'not_attending' ? '✗ 不参加' : '不参加にする'}
            </button>
          </div>
        )}
        {event.my_status === 'pending' && (
          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#b45309', fontWeight: 600 }}>⏳ 参加申請中（承認待ち）</span>
            <button className="btn btn-secondary btn-sm" onClick={() => handleAttend('not_attending')}>申請を取り消す</button>
          </div>
        )}

        {/* メモ欄 */}
        {canJoin && event.my_status && event.my_status !== 'pending' && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>備考</span>
              {!noteEditing && (
                <button className="btn btn-secondary btn-sm" onClick={() => setNoteEditing(true)} style={{ fontSize: '0.78rem' }}>
                  {event.my_note ? '編集' : '追加'}
                </button>
              )}
            </div>
            {noteEditing ? (
              <>
                <textarea
                  className="input"
                  style={{ width: '100%', boxSizing: 'border-box', minHeight: 64, resize: 'vertical', fontSize: '0.88rem' }}
                  placeholder="備考を入力（アレルギー、参加条件など）"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveNote} disabled={noteSaving}>
                    {noteSaving ? '保存中...' : '保存'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setNoteEditing(false); setNote(event.my_note ?? '') }}>
                    キャンセル
                  </button>
                </div>
              </>
            ) : (
              event.my_note
                ? <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap' }}>{event.my_note}</p>
                : <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>備考なし</p>
            )}
          </div>
        )}
      </div>

      {/* 参加者一覧 */}
      {user && canView && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            {[['attending', '参加予定'], ['not_attending', '不参加'], ...(canManage ? [['pending', '承認待ち']] : [])].map(([s, label]) => (
              <button key={s} onClick={() => switchTab(s)} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === s ? 700 : 400, borderBottom: tab === s ? '2px solid var(--primary)' : '2px solid transparent', color: tab === s ? 'var(--primary)' : 'var(--text-muted)' }}>
                {label}
              </button>
            ))}
          </div>
          {attendees.length === 0 ? (
            <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>該当者はいません</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {attendees.map(a => (
                <div key={a.id} className="card" style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MiniAvatar name={a.user_name} url={a.user_avatar_url} />
                    <span style={{ fontWeight: 500, flex: 1 }}>{a.user_name}</span>
                    {canManage && a.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={async () => { await api.approveAttendance(eventId, a.user_id, 'attending'); loadAttendees(tab) }}>承認</button>
                        <button className="btn btn-secondary btn-sm" style={{ color: '#c62828' }} onClick={async () => { await api.approveAttendance(eventId, a.user_id, 'rejected'); loadAttendees(tab) }}>拒否</button>
                      </div>
                    )}
                  </div>
                  {a.note && (
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', paddingLeft: '2.5rem', whiteSpace: 'pre-wrap' }}>
                      {a.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
