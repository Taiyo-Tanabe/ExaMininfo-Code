export default function Pagination({ skip, limit, total, onChange }) {
  const page       = Math.floor(skip / limit) + 1
  const totalPages = Math.ceil(total / limit)

  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <button
        className="btn btn-secondary btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(skip - limit)}
      >
        ← 前へ
      </button>
      <span className="page-info">
        {page} / {totalPages} ページ（全 {total} 件）
      </span>
      <button
        className="btn btn-secondary btn-sm"
        disabled={page >= totalPages}
        onClick={() => onChange(skip + limit)}
      >
        次へ →
      </button>
    </div>
  )
}
