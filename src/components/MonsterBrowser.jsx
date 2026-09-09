import { useMemo, useState } from 'react'
import bestiary from '../data/bestiary.json'
import { useCombat } from '../context/CombatContext'

const CATEGORIES = ['All', 'Non-Supernatural', 'Supernatural']
const TYPES = ['All', 'Solo', 'Mob']

function parseNum(val) {
  const match = String(val ?? '').match(/-?\d+(\.\d+)?/)
  return match ? parseFloat(match[0]) : 0
}

function incompleteReason(name, notes) {
  return notes.find((n) => n.includes(name))
}

function StatBox({ label, value }) {
  return (
    <div className="stat-box">
      <span className="stat-box-label">{label}</span>
      <span className="stat-box-value">{value === null || value === undefined || value === '' ? '—' : String(value)}</span>
    </div>
  )
}

export default function MonsterBrowser({ onQuickAdd }) {
  const { addCombatant } = useCombat()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [type, setType] = useState('All')

  const globalNotes = bestiary.notes || []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bestiary.antagonists.filter((m) => {
      const matchesQuery = !q
        || m.name.toLowerCase().includes(q)
        || (m.aliases || []).some((a) => a.toLowerCase().includes(q))
      const matchesCategory = category === 'All' || m.category === category
      const matchesType = type === 'All' || m.type === type
      return matchesQuery && matchesCategory && matchesType
    })
  }, [query, category, type])

  const handleQuickAdd = (m) => {
    addCombatant({
      name: m.name,
      type: 'Enemy',
      brawn: parseNum(m.brawn),
      smarts: parseNum(m.smarts),
      guts: parseNum(m.guts),
      armor: m.armor === null || m.armor === undefined ? 'None' : String(m.armor),
      initiative: m.initiative === null || m.initiative === undefined ? '' : String(m.initiative),
    })
    if (onQuickAdd) onQuickAdd(m)
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Bestiary</h2>
      </div>

      <div className="bestiary-filters">
        <input
          className="field field-name"
          placeholder="Search name or alias..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="result-count">{filtered.length} of {bestiary.antagonists.length}</span>
      </div>

      <div className="monster-grid">
        {filtered.map((m) => {
          const incomplete = incompleteReason(m.name, globalNotes)
          return (
            <article className={`monster-card category-${m.category === 'Supernatural' ? 'supernatural' : 'mundane'}`} key={m.name}>
              <header className="monster-card-header">
                <div>
                  <h3>{m.name}</h3>
                  {m.aliases && m.aliases.length > 0 && (
                    <p className="monster-aliases">aka {m.aliases.join(', ')}</p>
                  )}
                </div>
                {incomplete && (
                  <span className="incomplete-flag" title={incomplete}>⚠ verify</span>
                )}
              </header>

              <div className="monster-badges">
                <span className={`badge badge-${m.category === 'Supernatural' ? 'supernatural' : 'mundane'}`}>{m.category}</span>
                <span className="badge">{m.type}</span>
                {m.adventure && <span className="badge badge-adventure">{m.adventure}</span>}
              </div>

              {m.flavor && <p className="monster-flavor">{m.flavor}</p>}

              <div className="monster-stats">
                <StatBox label="Init" value={m.initiative} />
                <StatBox label="Armor" value={m.armor} />
                <StatBox label="Brawn" value={m.brawn} />
                <StatBox label="Smarts" value={m.smarts} />
                <StatBox label="Guts" value={m.guts} />
              </div>

              {m.weapons && m.weapons.length > 0 && (
                <div className="monster-section">
                  <h4>Weapons</h4>
                  <ul>
                    {m.weapons.map((w, i) => (
                      <li key={i}>
                        <strong>{w.name}</strong>
                        {w.damage !== null && w.damage !== undefined && <> — {w.damage} dmg{w.damageType ? ` (${w.damageType})` : ''}</>}
                        {w.abilities && <> · {w.abilities}</>}
                        {w.notes && <span className="note-text"> ({w.notes})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {m.skills && m.skills.length > 0 && (
                <div className="monster-section">
                  <h4>Skills / Abilities</h4>
                  <ul>
                    {m.skills.map((s, i) => (
                      <li key={i}>
                        <strong>{s.name}</strong>{s.rank !== null && s.rank !== undefined && ` — rank ${s.rank}`}
                        {s.notes && <span className="note-text"> ({s.notes})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="monster-section">
                <h4>Weakness</h4>
                <p>{m.weakness || 'None'}</p>
              </div>

              <div className="monster-section">
                <h4>Reward</h4>
                <p>{m.reward || 'None'}</p>
              </div>

              <button className="btn btn-accent quick-add-btn" onClick={() => handleQuickAdd(m)}>
                + Quick Add to Combat
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
