import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { fuzzyFilter } from '../utils/fuzzy'
import Pagination from '../components/Pagination'

const PAGE = 12

const SORT_OPTIONS = [
  { value: 'relevance', label: '関連度順' },
  { value: 'name-asc',  label: '大学名（昇順）' },
  { value: 'name-desc', label: '大学名（降順）' },
]

export default function SchoolsPage() {
  const [allSchools, setAllSchools] = useState([])
  const [heroTitle, setHeroTitle]   = useState('大学について、もっと知ろう。')
  const [homeDesc, setHomeDesc]     = useState('')
  const [q, setQ]                   = useState('')
  const [prefecture, setPref]       = useState('')
  const [sort, setSort]             = useState('name-asc')
  const [skip, setSkip]             = useState(0)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(false)
  const navigate = useNavigate()

  function load() {
    setLoading(true)
    setError(false)
    Promise.all([
      api.getSchools({ limit: 1000 }),
      api.getSiteContent('home_description').catch(() => ({ value: '' })),
      api.getSiteContent('hero_title').catch(() => ({ value: '' })),
    ]).then(([schools, desc, hero]) => {
      setAllSchools(schools.items)
      setHomeDesc(desc.value)
      if (hero.value) setHeroTitle(hero.value)
    }).catch(() => setError(true))
    .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = (() => {
    let items = allSchools
    let useRelevance = false

    if (q.trim()) {
      const fuzzyResults = fuzzyFilter(items, q, s => [s.name, s.yomi].filter(Boolean).join(' '))
      items = fuzzyResults.map(r => r.item)
      useRelevance = sort === 'relevance'
    }

    if (prefecture.trim()) {
      const pref = prefecture.trim().toLowerCase()
      items = items.filter(s =>
        s.prefecture.toLowerCase().includes(pref) ||
        (s.prefecture_yomi && s.prefecture_yomi.toLowerCase().includes(pref))
      )
    }

    if (useRelevance) return items  // fuzzyFilter の関連度順をそのまま使う

    const key = s => s.yomi || s.name
    if (sort === 'name-desc') return [...items].sort((a, b) => key(b).localeCompare(key(a), 'ja'))
    return [...items].sort((a, b) => key(a).localeCompare(key(b), 'ja'))
  })()

  const total = filtered.length
  const page  = filtered.slice(skip, skip + PAGE)

  function handleQ(val)  { setQ(val); setSkip(0); if (val.trim()) setSort('relevance') }
  function handlePref(e) { setPref(e.target.value); setSkip(0) }
  function handleSort(e) { setSort(e.target.value); setSkip(0) }

  return (
    <>
      {/* ── Hero ── */}
      <div className="hero-section">
        <div className="hero-content">
          <img src="/logo-em.svg" alt="ExaMininfo" className="hero-logo" />
          <h1 className="hero-title">{heroTitle}</h1>
          {homeDesc && <p className="hero-tagline">{homeDesc}</p>}
          <div className="hero-search-wrap">
            <input
              placeholder="🔍 大学名で検索"
              value={q}
              onChange={e => handleQ(e.target.value)}
              autoComplete="off"
            />
            <button className="hero-search-btn">検索</button>
          </div>
          <div className="hero-links">
            <Link to="/about">このサイトについて</Link>
            <Link to="/legal">利用規約・プライバシー</Link>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container">
        <div className="filter-bar">
          <input
            placeholder="都道府県で絞り込み（例: 東京都）"
            value={prefecture}
            onChange={handlePref}
          />
          <select value={sort} onChange={handleSort}>
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>サーバーに接続できませんでした。</p>
            <button className="btn btn-primary" onClick={load}>再試行</button>
          </div>
        ) : (
          <>
            <p className="section-title">
              {total > 0 ? `${total} 件の大学` : '検索結果'}
            </p>

            <div className="grid">
              {page.map(school => (
                <div
                  key={school.id}
                  className="card card-hover school-card"
                  onClick={() => navigate(`/schools/${school.id}`)}
                >
                  <p className="school-card-pref">🏫 {school.prefecture}</p>
                  <h2 className="school-card-name">{school.name}</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {school.courses.map(c => (
                      <span key={c.id} className="school-course-badge">
                        {c.name}
                        {c.deviation > 0 && (
                          <strong className="school-deviation">{c.deviation}</strong>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {page.length === 0 && (
              <p className="muted" style={{ textAlign: 'center', padding: '3rem' }}>
                該当する大学が見つかりませんでした
              </p>
            )}

            {total > PAGE && (
              <Pagination skip={skip} limit={PAGE} total={total} onChange={setSkip} />
            )}
          </>
        )}
      </div>
    </>
  )
}
