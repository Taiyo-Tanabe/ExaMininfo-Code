import { useState, useEffect } from 'react'
import { api } from '../api'

// Simple markdown-lite renderer (bold, headings, line breaks)
function renderContent(text) {
  if (!text) return <p className="muted">まだ内容が設定されていません。</p>
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '1.1rem', fontWeight: 700, margin: '1.5rem 0 0.5rem', color: 'var(--text)' }}>{line.slice(3)}</h2>
    if (line.startsWith('# '))  return <h1 key={i} style={{ fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.5rem', color: 'var(--text)' }}>{line.slice(2)}</h1>
    if (line === '') return <br key={i} />
    return <p key={i} style={{ margin: '0.3rem 0', fontSize: '0.92rem', lineHeight: 1.8 }}>{line}</p>
  })
}

export default function LegalPage() {
  const [content, setContent] = useState(null)

  useEffect(() => {
    api.getSiteContent('legal').then(d => setContent(d.value)).catch(() => {})
  }, [])

  if (content === null) return <div className="container"><div className="loading">読み込み中...</div></div>

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 className="page-title">法的情報</h1>
      <div className="card">
        {renderContent(content)}
      </div>
    </div>
  )
}
