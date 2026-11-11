import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { calculators, categories, defaults } from '../data/calculators.js'
import Field from '../components/Field.jsx'
export default function CalculatorPage() {
  const { id } = useParams()
  const c = calculators.find(x => x.id === id)
  const [vals, setVals] = useState(() => (c ? defaults(c) : {}))
  if (!c) return <main className="page"><Link to="/search" className="back">← Back</Link><p>Calculator not found.</p></main>
  const r = c.calc(vals)
  const set = k => val => setVals(v => ({ ...v, [k]: val }))
  return (
    <main className="page">
      <Link to="/search" className="back">← Back to search</Link>
      <header className={'chead cat-' + categories.indexOf(c.cat)}><small>{c.cat}</small><h2>{c.name}</h2><p>{c.desc}</p></header>
      <div className="calc">
        <section className="panel">
          <div className="fields">
            {c.fields.map(f => <Field key={f.k} f={f} value={vals[f.k]} onChange={set(f.k)} />)}
          </div>
          <button className="reset" onClick={() => setVals(defaults(c))}>↺ Reset</button>
        </section>
        <aside className={'result tone-' + r.tone}>
          <small>Result</small>
          <div className="main">{r.main}</div>
          <div className="text">{r.text}</div>
          {r.rows.length > 0 && (
            <table><tbody>{r.rows.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody></table>
          )}
        </aside>
      </div>
      {c.note && <p className="note">ℹ️ {c.note}</p>}
      <p className="foot">Decision-support only. Verify against clinical judgement and local protocols.</p>
    </main>
  )
}
