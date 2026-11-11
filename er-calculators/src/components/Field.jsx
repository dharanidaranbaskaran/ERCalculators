export default function Field({ f, value, onChange }) {
  if (f.t === 'chk')
    return (
      <label className="chk">
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />
        <span>{f.label}</span>
      </label>
    )
  // Mobile number keypads often have no minus key, so negative-capable fields get a +/- button
  const flip = () => {
    const v = String(value ?? '')
    onChange(v.startsWith('-') ? v.slice(1) : v === '' || v === '0' ? '-' : '-' + v)
  }
  const typed = e => {
    const t = e.target.value.replace(',', '.')
    if (/^-?\d*\.?\d*$/.test(t)) onChange(t)
  }
  return (
    <label className="fld">
      <span>{f.label}</span>
      {f.t === 'sel' ? (
        <select value={value} onChange={e => onChange(e.target.value)}>
          {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : f.neg ? (
        <div className="inp">
          <button type="button" className="sign" onClick={flip} aria-label="Toggle minus sign">+ / −</button>
          <input type="text" inputMode="decimal" value={value} onChange={typed} />
          {f.unit && <em>{f.unit}</em>}
        </div>
      ) : (
        <div className="inp">
          <input type="number" inputMode="decimal" step="any" min={f.min ?? 0} value={value} onChange={e => onChange(e.target.value)} />
          {f.unit && <em>{f.unit}</em>}
        </div>
      )}
    </label>
  )
}
