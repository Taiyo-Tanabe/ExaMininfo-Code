import { useState, useRef, useEffect } from 'react'
import { fuzzyFilter } from '../utils/fuzzy'

export default function SchoolAutocomplete({ schools, schoolId, onSelect, placeholder = '学校名を入力...' }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (schoolId) {
      const s = schools.find(s => s.id === Number(schoolId))
      if (s) setText(s.name)
    } else {
      setText('')
    }
  }, [schoolId, schools])

  const filtered = text
    ? fuzzyFilter(schools, text, s => s.name).slice(0, 10)
    : schools.slice(0, 10).map(item => ({ item, highlighted: item.name }))

  function handleInput(e) {
    setText(e.target.value)
    onSelect(null)
    setOpen(true)
  }

  function handleSelect(school) {
    setText(school.name)
    onSelect(school.id)
    setOpen(false)
  }

  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        if (!schoolId) setText('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [schoolId])

  return (
    <div className="autocomplete-wrap" ref={wrapRef}>
      <input
        className="autocomplete-input"
        value={text}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); if (!schoolId) setText('') } }}
      />
      {open && filtered.length > 0 && (
        <div className="autocomplete-dropdown">
          {filtered.map(({ item: s, highlighted }) => (
            <div
              key={s.id}
              className={`autocomplete-item${s.id === Number(schoolId) ? ' selected' : ''}`}
              onMouseDown={() => handleSelect(s)}
            >
              <span dangerouslySetInnerHTML={{ __html: highlighted }} />
              <span style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                {s.prefecture}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
