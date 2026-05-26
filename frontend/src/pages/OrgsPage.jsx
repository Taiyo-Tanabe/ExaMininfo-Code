import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import SchoolAutocomplete from '../components/SchoolAutocomplete'

const ORG_COLORS = [
  ['#29B6F6','#0288D1'],['#66BB6A','#2E7D32'],['#AB47BC','#6A1B9A'],
  ['#FF7043','#BF360C'],['#26C6DA','#00838F'],['#EC407A','#880E4F'],
]
function OrgIcon({ name, url, posX = 50, posY = 50, size = 40 }) {
  const [bg, fg] = ORG_COLORS[(name?.charCodeAt(0) ?? 0) % ORG_COLORS.length]
  if (url) return (
    <img src={url} alt={name} style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      objectFit: 'cover', objectPosition: `${posX}% ${posY}%`,
    }} />
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${bg}, ${fg})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 800, color: '#fff',
    }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

function MyRoleBadge({ role }) {
  if (!role) return null
  const styles = {
    creator: { bg: 'rgba(33,150,243,0.15)', color: '#0277bd', label: '作成者' },
    admin:   { bg: 'rgba(102,187,106,0.2)', color: '#2e7d32', label: '管理者' },
    member:  { bg: 'rgba(102,187,106,0.1)', color: '#2e7d32', label: 'メンバー' },
    pending: { bg: 'rgba(255,193,7,0.2)',   color: '#856404', label: '承認待ち' },
  }
  const s = styles[role]
  if (!s) return null
  return (
    <span className="badge" style={{ fontSize: '0.7rem', background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

export default function OrgsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [schools, setSchools] = useState([])
  const [courses, setCourses] = useState([])
  const [q, setQ] = useState('')
  const [schoolId, setSchoolId] = useState(null)
  const [department, setDepartment] = useState('')
  const [myOrgs, setMyOrgs] = useState(true)

  useEffect(() => {
    api.getSchools({ limit: 2000 }).then(d => setSchools(d.items ?? [])).catch(() => {})
  }, [])

  // 大学が変わったらコース一覧を更新
  useEffect(() => {
    setDepartment('')
    if (!schoolId) { setCourses([]); return }
    api.getCourses({ school_id: Number(schoolId), limit: 200 })
      .then(d => setCourses(d.items ?? []))
      .catch(() => setCourses([]))
  }, [schoolId])

  useEffect(() => {
    const params = { limit: 100 }
    if (q) params.q = q
    if (schoolId) params.school_id = schoolId
    if (department) params.department = department
    if (myOrgs && user) params.my_orgs = true
    api.getOrgs(params).then(setData).catch(() => {})
  }, [q, schoolId, department, myOrgs, user])

  const orgs = data?.items ?? []

  return (
    <div className="container" style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>団体一覧</h1>
        {user && (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/orgs/new')}>
            + 団体を作る
          </button>
        )}
      </div>

      {/* 検索・フィルタ */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div className="search-bar" style={{ margin: 0 }}>
          <input
            placeholder="🔍 団体名で検索..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <SchoolAutocomplete
              schools={schools}
              schoolId={schoolId}
              onSelect={setSchoolId}
              placeholder="🏫 大学で絞り込む..."
            />
          </div>
          {schoolId && courses.length > 0 && (
            <select
              className="input"
              style={{ flex: '1 1 160px', minWidth: 0 }}
              value={department}
              onChange={e => setDepartment(e.target.value)}
            >
              <option value="">すべてのコース</option>
              {courses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
        {user && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', fontSize: '0.88rem' }}>
            <input type="checkbox" checked={myOrgs} onChange={e => setMyOrgs(e.target.checked)} />
            自分が所属する団体のみ
          </label>
        )}
      </div>

      {orgs.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>
          {myOrgs ? '所属している団体はありません' : '該当する団体はありません'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {orgs.map(org => (
          <Link key={org.id} to={`/orgs/${org.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <OrgIcon name={org.name} url={org.icon_url} posX={org.icon_position_x} posY={org.icon_position_y} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 700, margin: 0 }}>{org.name}</p>
                      <MyRoleBadge role={org.my_role} />
                    </div>
                    {(org.school_name || org.department) && (
                      <p className="muted" style={{ fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                        🏫 {[org.school_name, org.department].filter(Boolean).join(' ／ ')}
                      </p>
                    )}
                    {org.description && (
                      <p className="muted" style={{ fontSize: '0.85rem', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
                        {org.description.length > 80 ? org.description.slice(0, 80) + '…' : org.description}
                      </p>
                    )}
                  </div>
                </div>
                <span className="muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  👥 {org.member_count + 1}人　📅 {org.event_count}件
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
