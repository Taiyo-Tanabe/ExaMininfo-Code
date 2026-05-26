import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'

const ORG_COLORS = [
  ['#29B6F6','#0288D1'],['#66BB6A','#2E7D32'],['#AB47BC','#6A1B9A'],
  ['#FF7043','#BF360C'],['#26C6DA','#00838F'],['#EC407A','#880E4F'],
]

function IconCropEditor({ iconUrl, posX, posY, onChange, onSave, saving }) {
  const SIZE = 160
  const dragRef = useRef(null)

  function startDrag(clientX, clientY) {
    dragRef.current = { startX: clientX, startY: clientY, posX, posY }
  }

  function moveDrag(clientX, clientY) {
    if (!dragRef.current) return
    const { startX, startY, posX: ox, posY: oy } = dragRef.current
    const dx = clientX - startX
    const dy = clientY - startY
    const SENS = SIZE * 1.5
    const nx = Math.max(0, Math.min(100, ox + (dx / SENS) * 100))
    const ny = Math.max(0, Math.min(100, oy + (dy / SENS) * 100))
    onChange(Math.round(nx), Math.round(ny))
  }

  function endDrag() { dragRef.current = null }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div
        style={{
          width: SIZE, height: SIZE, borderRadius: '50%', overflow: 'hidden',
          cursor: 'grab', border: '3px solid var(--border)', userSelect: 'none',
          boxShadow: '0 0 0 4px var(--bg)', touchAction: 'none',
        }}
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onMouseMove={e => { if (e.buttons === 1) moveDrag(e.clientX, e.clientY) }}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={e => { const t = e.touches[0]; startDrag(t.clientX, t.clientY) }}
        onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; moveDrag(t.clientX, t.clientY) }}
        onTouchEnd={endDrag}
      >
        <img
          src={iconUrl}
          alt="icon"
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, pointerEvents: 'none' }}
        />
      </div>
      <p className="muted" style={{ fontSize: '0.78rem', margin: 0 }}>ドラッグして表示位置を調整</p>
      <button className="btn btn-primary" onClick={onSave} disabled={saving}>
        {saving ? '保存中...' : 'この位置で保存'}
      </button>
    </div>
  )
}

export default function OrgIconEditPage() {
  const { orgId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [org, setOrg]           = useState(null)
  const [preview, setPreview]   = useState(null)
  const [posX, setPosX]         = useState(50)
  const [posY, setPosY]         = useState(50)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const [err, setErr]           = useState('')

  useEffect(() => {
    api.getOrg(orgId).then(o => {
      setOrg(o)
      setPreview(o.icon_url || null)
      setPosX(o.icon_position_x ?? 50)
      setPosY(o.icon_position_y ?? 50)
    }).catch(() => {})
  }, [orgId])

  if (!user) return <Navigate to="/login" replace />
  if (!org) return <div className="container"><div className="loading">読み込み中...</div></div>

  const [bg, fg] = ORG_COLORS[(org.name?.charCodeAt(0) ?? 0) % ORG_COLORS.length]

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setErr(''); setMsg('')
    try {
      setPreview(URL.createObjectURL(file))
      const result = await api.uploadOrgIcon(orgId, file)
      setPreview(result.icon_url)
      setMsg('アイコンを更新しました')
    } catch (e) { setErr(e.message); setPreview(org.icon_url || null) }
    finally { setUploading(false) }
  }

  async function handlePositionSave() {
    setSaving(true); setErr(''); setMsg('')
    try {
      await api.updateOrg(orgId, { icon_position_x: posX, icon_position_y: posY })
      setMsg('位置を保存しました')
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/orgs/${orgId}/dashboard`)}>
          ← 戻る
        </button>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>団体アイコンを変更</h1>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '2rem 1.5rem' }}>
        <div
          style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          {preview ? (
            <img
              src={preview}
              alt="icon"
              style={{
                width: 120, height: 120, borderRadius: '50%', objectFit: 'cover',
                objectPosition: `${posX}% ${posY}%`, border: '3px solid var(--border)',
                display: 'block',
              }}
            />
          ) : (
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: `linear-gradient(135deg, ${bg}, ${fg})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48, fontWeight: 800, color: '#fff',
            }}>
              {org.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.15rem',
          }}>
            <span style={{ fontSize: '1.6rem' }}>📷</span>
            <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 600 }}>
              {uploading ? '更新中...' : '変更'}
            </span>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

        <button
          className="btn btn-secondary"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ width: '100%' }}
        >
          {uploading ? 'アップロード中...' : '画像を選択'}
        </button>

        {err && <p className="error" style={{ margin: 0, width: '100%' }}>{err}</p>}
        {msg && <p className="success-msg" style={{ margin: 0 }}>{msg}</p>}

        {preview && (
          <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>表示位置を調整</p>
            <IconCropEditor
              iconUrl={preview}
              posX={posX}
              posY={posY}
              onChange={(x, y) => { setPosX(x); setPosY(y) }}
              onSave={handlePositionSave}
              saving={saving}
            />
          </div>
        )}

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(`/orgs/${orgId}/dashboard`)}
          style={{ marginTop: '0.5rem' }}
        >
          管理ページに戻る
        </button>
      </div>
    </div>
  )
}
