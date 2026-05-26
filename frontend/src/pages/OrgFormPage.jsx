import { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import SchoolAutocomplete from '../components/SchoolAutocomplete'

export default function OrgFormPage() {
  const { orgId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const isEdit = Boolean(orgId)

  const initialSchoolId = !isEdit && searchParams.get('school_id') ? Number(searchParams.get('school_id')) : null
  const [form, setForm] = useState({ name: '', description: '', school_id: initialSchoolId, department: '' })
  const [schools, setSchools] = useState([])
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const tasks = [
      api.getSchools({ limit: 2000 }).then(d => setSchools(d.items ?? [])).catch(() => {}),
    ]
    if (isEdit) {
      tasks.push(
        api.getOrg(orgId)
          .then(o => setForm({
            name: o.name,
            description: o.description ?? '',
            school_id: o.school_id ?? null,
            department: o.department ?? '',
          }))
          .catch(() => setError('読み込みに失敗しました'))
      )
    }
    Promise.all(tasks).finally(() => setLoading(false))
  }, [orgId])

  // 大学が変わったらコース一覧を更新
  useEffect(() => {
    if (!form.school_id) { setCourses([]); return }
    api.getCourses({ school_id: Number(form.school_id), limit: 200 })
      .then(d => setCourses(d.items ?? []))
      .catch(() => setCourses([]))
  }, [form.school_id])

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <div className="container"><div className="loading">読み込み中...</div></div>

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('団体名を入力してください'); return }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      school_id: form.school_id ? Number(form.school_id) : null,
      department: form.department.trim() || null,
    }
    setSaving(true)
    try {
      if (isEdit) {
        await api.updateOrg(orgId, payload)
        navigate(`/orgs/${orgId}`)
      } else {
        const org = await api.createOrg(payload)
        navigate(`/orgs/${org.id}`)
      }
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>
        {isEdit ? '団体を編集' : '団体を作る'}
      </h1>
      {error && (
        <div style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.4)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#c62828' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>団体名 <span style={{ color: 'red' }}>*</span></span>
          <input className="input" style={{ width: '100%', boxSizing: 'border-box' }}
            value={form.name} onChange={set('name')} placeholder="例: 写真部" maxLength={60} />
        </label>

        <label>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>説明</span>
          <textarea className="input" style={{ width: '100%', boxSizing: 'border-box', minHeight: 80, resize: 'vertical' }}
            value={form.description} onChange={set('description')} placeholder="団体の紹介を入力..." />
        </label>

        <div>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>大学</span>
          <SchoolAutocomplete
            schools={schools}
            schoolId={form.school_id}
            onSelect={id => setForm(f => ({ ...f, school_id: id, department: '' }))}
            placeholder="大学名を入力して検索..."
          />
        </div>

        <div>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>コース</span>
          {form.school_id && courses.length > 0 ? (
            <select
              className="input"
              style={{ width: '100%' }}
              value={form.department}
              onChange={set('department')}
            >
              <option value="">-- 選択しない --</option>
              {courses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          ) : (
            <input
              className="input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={form.department}
              onChange={set('department')}
              placeholder={form.school_id ? '手入力で入力...' : '大学を選ぶとコース一覧が表示されます'}
              maxLength={100}
            />
          )}
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
