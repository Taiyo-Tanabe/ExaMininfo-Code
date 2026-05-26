import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
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

function RequestSection({ items, onAction, actionLabels }) {
  if (items.length === 0) return (
    <p className="muted" style={{ padding: '1rem 0' }}>申請はありません</p>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {items.map(r => (
        <div key={r.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontWeight: 600 }}>{r.user_name}</span>
            <span className="muted" style={{ fontSize: '0.82rem', marginLeft: '0.5rem' }}>
              {new Date(r.created_at).toLocaleDateString('ja-JP')}
            </span>
          </div>
          {r.status === 'pending' ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => onAction(r, actionLabels[0])}>承認</button>
              <button className="btn btn-secondary btn-sm" style={{ color: '#c62828' }} onClick={() => onAction(r, actionLabels[1])}>拒否</button>
            </div>
          ) : (
            <span className="badge" style={{
              background: r.status === 'approved' ? 'rgba(102,187,106,0.25)' : 'rgba(239,83,80,0.15)',
              color: r.status === 'approved' ? '#2e7d32' : '#c62828',
            }}>
              {r.status === 'approved' ? '承認済み' : '拒否済み'}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function MemberSection({ pendingMembers, approvedMembers, onApprove, onReject, onRoleChange, onRemove }) {
  return (
    <div>
      {/* 承認待ち */}
      {pendingMembers.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#856404' }}>
            承認待ち ({pendingMembers.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingMembers.map(m => (
              <div key={m.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Avatar name={m.user_name} url={m.user_avatar_url} posX={m.user_avatar_position_x} posY={m.user_avatar_position_y} size={28} />
                  <span style={{ fontWeight: 600, flex: 1 }}>{m.user_name}</span>
                  <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => onApprove(m)}>承認</button>
                    <button className="btn btn-sm" style={{ background: 'rgba(239,83,80,0.12)', color: '#c62828' }} onClick={() => onReject(m)}>拒否</button>
                  </div>
                </div>
                {m.personal_info && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '2.5rem', whiteSpace: 'pre-wrap' }}>
                    {m.personal_info}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>承認済みメンバー</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {approvedMembers.length === 0 && (
          <p className="muted" style={{ padding: '0.5rem 0', fontSize: '0.9rem' }}>メンバーはいません</p>
        )}

        {approvedMembers.map(m => (
          <div key={m.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Avatar name={m.user_name} url={m.user_avatar_url} posX={m.user_avatar_position_x} posY={m.user_avatar_position_y} size={28} />
            <span style={{ fontWeight: 600, flex: 1 }}>{m.user_name}</span>
            {m.role === 'admin' && (
              <span className="badge" style={{ background: 'rgba(102,187,106,0.2)', color: '#2e7d32', fontSize: '0.72rem' }}>管理者</span>
            )}
            <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onRoleChange(m, m.role === 'admin' ? 'member' : 'admin')}
              >
                {m.role === 'admin' ? 'メンバーに変更' : '管理者にする'}
              </button>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(239,83,80,0.12)', color: '#c62828' }}
                onClick={() => onRemove(m)}
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrgDashboardPage() {
  const { orgId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [org, setOrg] = useState(null)
  const [events, setEvents] = useState([])
  const [pendingMembers, setPendingMembers] = useState([])
  const [approvedMembers, setApprovedMembers] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [viewReqs, setViewReqs] = useState([])
  const [joinReqs, setJoinReqs] = useState([])
  const [mainTab, setMainTab] = useState('members')
  const [eventTab, setEventTab] = useState('view')
  const [loading, setLoading] = useState(true)
  const [promptValue, setPromptValue] = useState('')
  const [promptSaving, setPromptSaving] = useState(false)

  async function loadMembers() {
    const [pending, approved] = await Promise.all([
      api.getOrgMembers(orgId, 'pending'),
      api.getOrgMembers(orgId, 'approved'),
    ])
    setPendingMembers(pending)
    setApprovedMembers(approved)
  }

  useEffect(() => {
    Promise.all([
      api.getOrg(orgId),
      api.getEvents({ org_id: orgId, limit: 100 }),
      api.getOrgMembers(orgId, 'pending'),
      api.getOrgMembers(orgId, 'approved'),
    ])
      .then(([o, ev, pending, approved]) => {
        setOrg(o); setEvents(ev.items)
        setPendingMembers(pending); setApprovedMembers(approved)
        setPromptValue(o.personal_info_prompt ?? '')
      })
      .finally(() => setLoading(false))
  }, [orgId])

  async function selectEvent(ev) {
    setSelectedEvent(ev)
    const [vr, jr] = await Promise.all([
      ev.requires_view_approval ? api.getViewRequests(ev.id).catch(() => []) : Promise.resolve([]),
      ev.requires_join_approval ? api.getAttendees(ev.id, { status: 'pending' }).catch(() => []) : Promise.resolve([]),
    ])
    setViewReqs(vr)
    setJoinReqs(jr)
  }

  async function handleApprove(member) {
    try { await api.updateMember(orgId, member.user_id, { status: 'approved' }); await loadMembers() }
    catch (e) { alert(e.message) }
  }

  async function handleReject(member) {
    if (!confirm(`「${member.user_name}」の加入申請を拒否しますか？`)) return
    try { await api.removeMember(orgId, member.user_id); await loadMembers() }
    catch (e) { alert(e.message) }
  }

  async function handleRoleChange(member, newRole) {
    try { await api.updateMember(orgId, member.user_id, { role: newRole }); await loadMembers() }
    catch (e) { alert(e.message) }
  }

  async function handleRemoveMember(member) {
    if (!confirm(`「${member.user_name}」をメンバーから削除しますか？`)) return
    try { await api.removeMember(orgId, member.user_id); await loadMembers() }
    catch (e) { alert(e.message) }
  }

  async function handleViewAction(req, status) {
    await api.handleViewRequest(selectedEvent.id, req.user_id, status)
    selectEvent(selectedEvent)
  }

  async function handleJoinAction(req, status) {
    await api.approveAttendance(selectedEvent.id, req.user_id, status)
    selectEvent(selectedEvent)
  }

  async function handleSavePrompt() {
    setPromptSaving(true)
    try {
      await api.updateOrg(orgId, { personal_info_prompt: promptValue.trim() || null })
      setOrg(o => ({ ...o, personal_info_prompt: promptValue.trim() || null }))
    } catch (e) { alert(e.message) }
    finally { setPromptSaving(false) }
  }

  if (loading) return <div className="container"><div className="loading">読み込み中...</div></div>
  if (!org) return <div className="container"><p className="muted">団体が見つかりません</p></div>

  const myRole = org.my_role
  const canManage = user && (user.id === org.created_by || myRole === 'admin')
  if (!canManage) return <Navigate to={`/orgs/${orgId}`} replace />

  const pendingCount = pendingMembers.length

  const tabStyle = (t) => ({
    padding: '0.5rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
    fontWeight: mainTab === t ? 700 : 400,
    borderBottom: mainTab === t ? '2px solid var(--primary)' : '2px solid transparent',
    color: mainTab === t ? 'var(--primary)' : 'var(--text-muted)',
  })

  return (
    <div className="container" style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to={`/orgs/${orgId}`} className="muted" style={{ fontSize: '0.9rem', textDecoration: 'none' }}>← {org.name}</Link>
      </div>
      <h1 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>管理ダッシュボード</h1>

      {/* メインタブ */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => setMainTab('members')} style={tabStyle('members')}>
          メンバー管理
          {pendingCount > 0 && <span className="badge" style={{ marginLeft: '0.4rem', background: 'rgba(239,83,80,0.15)', color: '#c62828' }}>{pendingCount}</span>}
        </button>
        <button onClick={() => setMainTab('events')} style={tabStyle('events')}>
          イベント承認
        </button>
        <button onClick={() => setMainTab('settings')} style={tabStyle('settings')}>
          設定
        </button>
      </div>

      {/* メンバー管理タブ */}
      {mainTab === 'members' && (
        <MemberSection
          pendingMembers={pendingMembers}
          approvedMembers={approvedMembers}
          onApprove={handleApprove}
          onReject={handleReject}
          onRoleChange={handleRoleChange}
          onRemove={handleRemoveMember}
        />
      )}

      {/* イベント承認タブ */}
      {mainTab === 'events' && (
        <>
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>対象イベントを選択</p>
            <select
              className="input" style={{ width: '100%' }}
              value={selectedEvent?.id ?? ''}
              onChange={e => {
                const ev = events.find(x => x.id === Number(e.target.value))
                if (ev) selectEvent(ev)
              }}
            >
              <option value="">-- イベントを選んでください --</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>

          {selectedEvent && (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                {selectedEvent.requires_view_approval && (
                  <button onClick={() => setEventTab('view')} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: eventTab === 'view' ? 700 : 400, borderBottom: eventTab === 'view' ? '2px solid var(--primary)' : '2px solid transparent', color: eventTab === 'view' ? 'var(--primary)' : 'var(--text-muted)' }}>
                    閲覧申請 ({viewReqs.filter(r => r.status === 'pending').length})
                  </button>
                )}
                {selectedEvent.requires_join_approval && (
                  <button onClick={() => setEventTab('join')} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: eventTab === 'join' ? 700 : 400, borderBottom: eventTab === 'join' ? '2px solid var(--primary)' : '2px solid transparent', color: eventTab === 'join' ? 'var(--primary)' : 'var(--text-muted)' }}>
                    参加申請 ({joinReqs.length})
                  </button>
                )}
                {!selectedEvent.requires_view_approval && !selectedEvent.requires_join_approval && (
                  <p className="muted" style={{ padding: '0.5rem 0' }}>このイベントに承認設定はありません</p>
                )}
              </div>
              {eventTab === 'view' && selectedEvent.requires_view_approval && (
                <RequestSection items={viewReqs} onAction={handleViewAction} actionLabels={['approved', 'rejected']} />
              )}
              {eventTab === 'join' && selectedEvent.requires_join_approval && (
                <RequestSection items={joinReqs} onAction={handleJoinAction} actionLabels={['attending', 'rejected']} />
              )}
            </>
          )}
        </>
      )}

      {/* 設定タブ */}
      {mainTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem' }}>団体アイコン</h2>
              <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>団体の顔となるアイコン画像を設定できます。</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/orgs/${orgId}/icon`)}>
              アイコンを変更
            </button>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>加入申請フォームの案内文</h2>
          <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            加入申請者に入力してもらう情報の説明文を設定できます（学籍番号、学年など）。
          </p>
          <textarea
            className="input"
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 100, resize: 'vertical', marginBottom: '0.75rem' }}
            placeholder="例：学年と学籍番号を記入してください。"
            value={promptValue}
            onChange={e => setPromptValue(e.target.value)}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSavePrompt}
            disabled={promptSaving}
          >
            {promptSaving ? '保存中...' : '保存する'}
          </button>
          </div>
        </div>
      )}
    </div>
  )
}
