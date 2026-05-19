import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '1.25rem 1rem',
      marginTop: '3rem',
      textAlign: 'center',
      fontSize: '0.8rem',
      color: 'var(--muted)',
      display: 'flex',
      gap: '1.5rem',
      justifyContent: 'center',
      flexWrap: 'wrap',
    }}>
      <Link to="/about" style={{ color: 'var(--muted)', textDecoration: 'none' }}>このサイトについて</Link>
      <Link to="/legal" style={{ color: 'var(--muted)', textDecoration: 'none' }}>法的情報</Link>
      <span>© 2026 ExaMininfo</span>
    </footer>
  )
}
