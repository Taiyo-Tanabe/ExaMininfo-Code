import { useState, useEffect } from 'react'
import { api } from '../api'

export default function CourseSelect({ schoolId, value, onChange }) {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    if (!schoolId) { setCourses([]); onChange(''); return }
    api.getCourses({ school_id: schoolId, limit: 50, sort_by: 'deviation', order: 'desc' })
      .then(d => setCourses(d.items))
  }, [schoolId])

  if (!schoolId || courses.length === 0) return null

  return (
    <div className="form-group">
      <label>投稿内容のコースを選択</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">投稿内容のコースを選択</option>
        {courses.map(c => (
          <option key={c.id} value={c.name}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}
