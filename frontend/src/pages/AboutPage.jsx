import { useState, useEffect } from 'react'
import { api } from '../api'

const DEFAULT_ABOUT = `ExaMininfo（イグザミニンフォー）は、日本の大学に関する情報を学生同士で共有できるSNSプラットフォームです。

■ 主な機能

・大学一覧・詳細表示
  全国の大学の偏差値・学科情報を閲覧できます。漢字・ひらがな・ローマ字での大学名検索に対応しています。

・口コミ・レビュー
  大学・学科ごとの口コミや星評価を投稿・閲覧できます。

・事件・問題の情報共有
  大学で起きた出来事や問題を投稿・共有できます。

・タイムライン
  大学ごとのタイムラインで自由に投稿・リポスト・リプライができます。

・団体（サークル・学生団体）
  サークルや学生団体を作成し、メンバーの管理・加入申請ができます。団体ごとにアイコンを設定できます。

・イベント
  団体主催のイベントを作成・公開できます。参加申請・閲覧制限・承認フローに対応しています。

■ 注意事項

投稿された情報はユーザー自身の責任によるものであり、運営はその正確性を保証しません。不適切な投稿は通報機能よりご報告ください。`

export default function AboutPage() {
  const [content, setContent] = useState(null)

  useEffect(() => {
    api.getSiteContent('about').then(d => setContent(d.value)).catch(() => setContent(''))
  }, [])

  if (content === null) return <div className="container"><div className="loading">読み込み中...</div></div>

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 className="page-title">このサイトについて</h1>
      <div className="card">
        <div className="prose" style={{ lineHeight: 1.9, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
          {content || DEFAULT_ABOUT}
        </div>
      </div>
    </div>
  )
}
