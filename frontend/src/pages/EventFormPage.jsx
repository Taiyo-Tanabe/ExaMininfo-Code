import { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'

function toDateInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

function toTimeInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildIso(date, time) {
  if (!date) return null
  return new Date(`${date}T${time || '00:00'}`).toISOString()
}

export default function EventFormPage() {
  const { eventId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = Boolean(eventId)

  const [orgs, setOrgs] = useState([])
  const [form, setForm] = useState({
    org_id: searchParams.get('org_id') ?? '',
    title: '',
    description: '',
    location: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    max_participants: '',
    requires_view_approval: false,
    requires_join_approval: false,
    allow_member_view: true,
    allow_member_join: true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const tasks = [
      api.getOrgs({ limit: 200 }).then(d => setOrgs(d.items)).catch(() => {}),
    ]
    if (isEdit) {
      tasks.push(
        api.getEvent(eventId).then(ev => setForm({
          org_id: ev.org_id ?? '',
          title: ev.title ?? '',
          description: ev.description ?? '',
          location: ev.location ?? '',
          start_date: toDateInput(ev.start_at),
          start_time: toTimeInput(ev.start_at),
          end_date: toDateInput(ev.end_at),
          end_time: toTimeInput(ev.end_at),
          max_participants: ev.max_participants ?? '',
          requires_view_approval: ev.requires_view_approval ?? false,
          requires_join_approval: ev.requires_join_approval ?? false,
          allow_member_view: ev.allow_member_view ?? true,
          allow_member_join: ev.allow_member_join ?? true,
        })).catch(() => setError('読み込みに失敗しました'))
      )
    }
    Promise.all(tasks).finally(() => setLoading(false))
  }, [eventId])

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <div className="container"><div className="loading">読み込み中...</div></div>

  // 自分が作成者・管理者の団体だけ選択肢に出す（admin は全部）
  const myOrgs = user.role === 'admin'
    ? orgs
    : orgs.filter(o => o.created_by === user.id || o.my_role === 'admin')

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }
  function toggle(field) { return () => setForm(f => ({ ...f, [field]: !f[field] })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.org_id)   { setError('団体を選択してください'); return }
    if (!form.title.trim()) { setError('タイトルを入力してください'); return }

    const payload = {
      org_id: Number(form.org_id),
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      start_at: buildIso(form.start_date, form.start_time),
      end_at: buildIso(form.end_date, form.end_time),
      max_participants: form.max_participants ? parseInt(form.max_participants, 10) : null,
      requires_view_approval: form.requires_view_approval,
      requires_join_approval: form.requires_join_approval,
      allow_member_view: form.allow_member_view,
      allow_member_join: form.allow_member_join,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.updateEvent(eventId, payload)
        navigate(`/events/${eventId}`)
      } else {
        const ev = await api.createEvent(payload)
        navigate(`/events/${ev.id}`)
      }
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>
        {isEdit ? 'イベントを編集' : '新規イベント作成'}
      </h1>

      {error && (
        <div style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.4)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#c62828' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

        <label>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>団体 <span style={{ color: 'red' }}>*</span></span>
          {myOrgs.length === 0 ? (
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              まず<a href="/orgs/new" style={{ color: 'var(--primary)' }}>団体を作成</a>してください
            </p>
          ) : (
            <select className="input" style={{ width: '100%' }} value={form.org_id} onChange={set('org_id')}>
              <option value="">-- 団体を選択 --</option>
              {myOrgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
        </label>

        <label>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>タイトル <span style={{ color: 'red' }}>*</span></span>
          <input className="input" style={{ width: '100%', boxSizing: 'border-box' }}
            value={form.title} onChange={set('title')} placeholder="例: 5月定例ミーティング" maxLength={100} />
        </label>

        <label>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>説明</span>
          <textarea className="input" style={{ width: '100%', boxSizing: 'border-box', minHeight: 90, resize: 'vertical' }}
            value={form.description} onChange={set('description')} placeholder="イベントの詳細..." />
        </label>

        <label>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>場所</span>
          <input className="input" style={{ width: '100%', boxSizing: 'border-box' }}
            value={form.location} onChange={set('location')} placeholder="例: Zoom / 第一会議室" />
        </label>

        <div>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>開始日時</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <input type="date" className="input" style={{ width: '100%', boxSizing: 'border-box' }}
              value={form.start_date} onChange={set('start_date')} />
            <input type="time" className="input" style={{ width: '100%', boxSizing: 'border-box' }}
              value={form.start_time} onChange={set('start_time')} />
          </div>
        </div>
        <div>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>終了日時</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <input type="date" className="input" style={{ width: '100%', boxSizing: 'border-box' }}
              value={form.end_date} onChange={set('end_date')} />
            <input type="time" className="input" style={{ width: '100%', boxSizing: 'border-box' }}
              value={form.end_time} onChange={set('end_time')} />
          </div>
        </div>

        <label>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>定員（空欄で無制限）</span>
          <input type="number" className="input" style={{ width: 120 }}
            value={form.max_participants} onChange={set('max_participants')} min={1} placeholder="例: 20" />
        </label>

        {/* 承認設定 */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>承認設定</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.requires_view_approval} onChange={toggle('requires_view_approval')} />
              <span>閲覧に団体の承認が必要</span>
              <span className="muted" style={{ fontSize: '0.8rem' }}>（タイトル・詳細ともに承認後のみ閲覧可）</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.requires_join_approval} onChange={toggle('requires_join_approval')} />
              <span>参加申請に団体の承認が必要</span>
              <span className="muted" style={{ fontSize: '0.8rem' }}>（申請後、承認されると参加確定）</span>
            </label>
          </div>
        </div>

        {/* メンバー向け設定 */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>メンバー向け設定</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.allow_member_view} onChange={toggle('allow_member_view')} />
              <span>承認済みメンバーは閲覧を許可する</span>
              <span className="muted" style={{ fontSize: '0.8rem' }}>（閲覧承認が必要な場合でも、メンバーは閲覧可）</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.allow_member_join} onChange={toggle('allow_member_join')} />
              <span>承認済みメンバーは参加申請を許可する</span>
              <span className="muted" style={{ fontSize: '0.8rem' }}>（参加承認が必要な場合でも、メンバーは直接参加可）</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : isEdit ? '更新する' : '作成する'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>キャンセル</button>
        </div>
      </form>
    </div>
  )
}
