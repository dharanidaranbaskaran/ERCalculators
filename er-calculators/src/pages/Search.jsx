import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { calculators, categories } from '../data/calculators.js'
export default function Search() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return calculators.filter(c =>
      (cat === 'All' || c.cat === cat) &&
      (!t || (c.name + ' ' + c.cat + ' ' + c.desc).toLowerCase().includes(t)))
  }, [q, cat])
  return (
    <main className="page">
      <Link to="/" className="back">← Home</Link>
      <h2>Search Calculators</h2>
      <input className="search" autoFocus placeholder="Type a calculator name, e.g. GCS, SOFA, HEART…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="chips">
        {['All', ...categories].map(c => (
          <button key={c} className={'chip ' + (cat === c ? 'on' : '')} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="grid">
        {list.map(c => (
          <Link key={c.id} to={'/calc/' + c.id} className={'card cat-' + categories.indexOf(c.cat)}>
            <small>{c.cat}</small><strong>{c.name}</strong><span>{c.desc}</span>
          </Link>
        ))}
        {!list.length && <p className="muted">No calculator found.</p>}
      </div>
    </main>
  )
}
