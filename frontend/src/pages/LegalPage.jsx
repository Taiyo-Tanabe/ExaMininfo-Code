import { useState, useEffect } from 'react'
import { api } from '../api'

// Simple markdown-lite renderer (bold, headings, line breaks)
const DEFAULT_LEGAL = `# 利用規約

## 1. サービスの利用
本サービス「ExaMininfo」は、日本の大学に関する情報を学生同士で共有することを目的としたプラットフォームです。ユーザーは本規約に同意の上、サービスを利用するものとします。

## 2. 禁止事項
以下の行為を禁止します。
・他者を誹謗中傷・差別する投稿
・虚偽の情報の投稿・拡散
・個人情報の無断掲載
・スパム・宣伝目的の投稿
・その他、法令または公序良俗に反する行為

## 3. 投稿内容について
投稿された口コミ・事件情報・タイムライン投稿はユーザー自身の責任によるものです。運営は投稿内容の正確性を保証しません。不適切と判断された投稿は予告なく削除する場合があります。

## 4. 団体・イベント機能について
団体の作成・運営、イベントの開催はユーザーの責任において行われます。加入申請・参加申請に際して取得する個人情報の取り扱いは、各団体の管理者の責任となります。

## 5. サービスの変更・終了
運営は予告なくサービス内容の変更・停止・終了を行う場合があります。

# プライバシーポリシー

## 収集する情報
・アカウント登録時のメールアドレス・ユーザー名
・投稿・レビュー・コメントなどのコンテンツ
・アイコン画像（アップロードした場合）

## 情報の利用目的
・サービスの提供・運営
・不正利用の防止
・サービス改善のための分析

## 情報の第三者提供
法令に基づく場合を除き、ユーザーの個人情報を第三者に提供しません。

## アカウント削除
アカウント設定ページからアカウントを削除できます。削除後、投稿データは匿名化または削除されます。`

function renderContent(text) {
  if (!text) text = DEFAULT_LEGAL
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
      <h1 className="page-title">利用規約・プライバシー</h1>
      <div className="card">
        {renderContent(content)}
      </div>
    </div>
  )
}
