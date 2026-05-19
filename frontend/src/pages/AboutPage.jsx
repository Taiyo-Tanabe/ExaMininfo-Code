import { useState, useEffect } from 'react'
import { api } from '../api'

export default function AboutPage() {
  const [content, setContent] = useState(null)

  useEffect(() => {
    api.getSiteContent('about').then(d => setContent(d.value)).catch(() => {})
  }, [])

  if (content === null) return <div className="container"><div className="loading">読み込み中...</div></div>

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 className="page-title">このサイトについて</h1>
      <div className="card">
        <div className="prose" style={{ lineHeight: 1.9, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
          {content || 'まだ内容が設定されていません。'}
        </div>
      </div>
    </div>
  )
}
