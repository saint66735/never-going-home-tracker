import { useMemo, useState } from 'react'
import { useCombat, isCombatantDown } from '../context/CombatContext'

const TRACKS = [
  { key: 'brawn', label: 'Brawn' },
  { key: 'smarts', label: 'Smarts' },
  { key: 'guts', label: 'Guts' },
]

function TrackCell({ combatant, trackKey, adjustTrack, setTrackMax }) {
  const t = combatant[trackKey]
  return (
    <div className="track-cell">
      <button className="pip-btn" onClick={() => adjustTrack(combatant.id, trackKey, -1)} aria-label={`decrease ${trackKey}`}>−</button>
      <span className={`track-value ${t.cur === 0 ? 'is-zero' : ''}`}>{t.cur}</span>
      <span className="track-slash">/</span>
      <input
        className="track-max-input"
        type="number"
        min="0"
        value={t.max}
        onChange={(e) => setTrackMax(combatant.id, trackKey, parseInt(e.target.value, 10) || 0)}
      />
      <button className="pip-btn" onClick={() => adjustTrack(combatant.id, trackKey, 1)} aria-label={`increase ${trackKey}`}>+</button>
    </div>
  )
}

export default function CombatTracker() {
  const {
    combatants, round, currentTurnId,
    addCombatant, removeCombatant, updateCombatant,
    adjustTrack, setTrackMax, moveCombatant,
    sortByInitiative, setCurrentTurnId, toggleActed, nextRound, setRound, resetCombat,
  } = useCombat()

  const [form, setForm] = useState({
    name: '', type: 'Enemy', brawn: 3, smarts: 3, guts: 3, armor: 'None', initiative: '',
  })

  const pendingCount = useMemo(
    () => combatants.filter((c) => !c.acted && !isCombatantDown(c)).length,
    [combatants],
  )
  const canAdvanceRound = combatants.length > 0 && pendingCount === 0

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    addCombatant({
      ...form,
      brawn: parseInt(form.brawn, 10) || 0,
      smarts: parseInt(form.smarts, 10) || 0,
      guts: parseInt(form.guts, 10) || 0,
    })
    setForm({ name: '', type: 'Enemy', brawn: 3, smarts: 3, guts: 3, armor: 'None', initiative: '' })
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Combat Tracker</h2>
        <div className="round-controls">
          <span className="round-label">Round</span>
          <button className="pip-btn" onClick={() => setRound(round - 1)}>−</button>
          <span className="round-value">{round}</span>
          <button className="pip-btn" onClick={() => setRound(round + 1)}>+</button>
          <button
            className="btn btn-accent"
            onClick={nextRound}
            disabled={!canAdvanceRound}
            title={canAdvanceRound ? 'Everyone has acted — start the next round' : `${pendingCount} combatant${pendingCount === 1 ? '' : 's'} still need to act`}
          >
            Next Round ▸
          </button>
          {!canAdvanceRound && combatants.length > 0 && (
            <span className="pending-note">{pendingCount} left to act</span>
          )}
          <button className="btn" onClick={sortByInitiative} disabled={combatants.length < 2}>Sort by Initiative</button>
          <button
            className="btn btn-danger"
            onClick={() => { if (window.confirm('Clear the entire combat tracker?')) resetCombat() }}
          >
            Reset
          </button>
        </div>
      </div>

      <form className="add-combatant-form" onSubmit={handleAdd}>
        <input
          className="field field-name"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <select
          className="field"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option>PC</option>
          <option>Enemy</option>
          <option>Mob</option>
        </select>
        <input className="field field-narrow" type="number" title="Brawn" placeholder="Brawn" value={form.brawn} onChange={(e) => setForm({ ...form, brawn: e.target.value })} />
        <input className="field field-narrow" type="number" title="Smarts" placeholder="Smarts" value={form.smarts} onChange={(e) => setForm({ ...form, smarts: e.target.value })} />
        <input className="field field-narrow" type="number" title="Guts" placeholder="Guts" value={form.guts} onChange={(e) => setForm({ ...form, guts: e.target.value })} />
        <input className="field field-narrow" placeholder="Armor" value={form.armor} onChange={(e) => setForm({ ...form, armor: e.target.value })} />
        <input className="field field-narrow" placeholder="Initiative" value={form.initiative} onChange={(e) => setForm({ ...form, initiative: e.target.value })} />
        <button className="btn btn-accent" type="submit">+ Add Combatant</button>
      </form>

      {combatants.length === 0 ? (
        <p className="empty-state">No combatants yet. Add one above, or use "Quick Add to Combat" from the Bestiary.</p>
      ) : (
        <div className="combatant-table-wrap">
          <table className="combatant-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Type</th>
                <th>Brawn</th>
                <th>Smarts</th>
                <th>Guts</th>
                <th>Armor</th>
                <th>Initiative</th>
                <th>Acted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {combatants.map((c, idx) => {
                const down = isCombatantDown(c)
                return (
                <tr
                  key={c.id}
                  className={`combatant-row type-${c.type.toLowerCase()} ${currentTurnId === c.id ? 'is-current-turn' : ''} ${down ? 'is-down' : ''}`}
                >
                  <td className="reorder-cell">
                    <button className="pip-btn tiny" onClick={() => moveCombatant(c.id, -1)} disabled={idx === 0} aria-label="move up">▲</button>
                    <button className="pip-btn tiny" onClick={() => moveCombatant(c.id, 1)} disabled={idx === combatants.length - 1} aria-label="move down">▼</button>
                  </td>
                  <td>
                    <button
                      className="turn-marker-btn"
                      title="Mark as current turn"
                      onClick={() => setCurrentTurnId(currentTurnId === c.id ? null : c.id)}
                    >
                      {currentTurnId === c.id ? '● ' : ''}
                    </button>
                    <input
                      className="field field-inline"
                      value={c.name}
                      onChange={(e) => updateCombatant(c.id, { name: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      className="field field-inline"
                      value={c.type}
                      onChange={(e) => updateCombatant(c.id, { type: e.target.value })}
                    >
                      <option>PC</option>
                      <option>Enemy</option>
                      <option>Mob</option>
                    </select>
                  </td>
                  {TRACKS.map((t) => (
                    <td key={t.key}>
                      <TrackCell combatant={c} trackKey={t.key} adjustTrack={adjustTrack} setTrackMax={setTrackMax} />
                    </td>
                  ))}
                  <td>
                    <input
                      className="field field-inline field-narrow"
                      value={c.armor}
                      onChange={(e) => updateCombatant(c.id, { armor: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="field field-inline field-narrow"
                      value={c.initiative}
                      onChange={(e) => updateCombatant(c.id, { initiative: e.target.value })}
                    />
                  </td>
                  <td className="acted-cell">
                    <input
                      type="checkbox"
                      className="acted-checkbox"
                      checked={c.acted || down}
                      disabled={down}
                      title={down ? 'Defeated — excluded from the round gate' : 'Mark as having acted this round'}
                      onChange={() => toggleActed(c.id)}
                    />
                  </td>
                  <td>
                    <button className="btn btn-danger btn-small" onClick={() => removeCombatant(c.id)}>✕</button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
