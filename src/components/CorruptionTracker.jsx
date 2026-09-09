import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const STORAGE_KEY = 'ngh-corruption-tracker'

const initialState = {
  blurred: false,
  pcs: [],
}

const THRESHOLD_HINTS = {
  3: 'Corruption starts showing: unsettling tics, whispers only they hear, small cruelties creeping into their choices. Consider surfacing this in narration.',
  4: 'The Other is close to the surface. Expect visible changes, intrusive impulses, and a real risk of losing control under stress. (Exact table effects — check the corebook.)',
  5: 'Full succumb. The character becomes one of the Disfigured — a demon that was once a soldier (see Bestiary: "The Disfigured"). This is likely the end of the line for the PC as written.',
}

function makeId() {
  return `pc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function CorruptionTracker() {
  const [state, setState] = useLocalStorage(STORAGE_KEY, initialState)
  const [newName, setNewName] = useState('')

  const addPc = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setState((prev) => ({
      ...prev,
      pcs: [...prev.pcs, { id: makeId(), name: newName.trim(), corruption: 0, notes: '' }],
    }))
    setNewName('')
  }

  const removePc = (id) => {
    setState((prev) => ({ ...prev, pcs: prev.pcs.filter((p) => p.id !== id) }))
  }

  const adjustCorruption = (id, delta) => {
    setState((prev) => ({
      ...prev,
      pcs: prev.pcs.map((p) => (p.id === id ? { ...p, corruption: Math.max(0, Math.min(5, p.corruption + delta)) } : p)),
    }))
  }

  const updateNotes = (id, notes) => {
    setState((prev) => ({ ...prev, pcs: prev.pcs.map((p) => (p.id === id ? { ...p, notes } : p)) }))
  }

  const updateName = (id, name) => {
    setState((prev) => ({ ...prev, pcs: prev.pcs.map((p) => (p.id === id ? { ...p, name } : p)) }))
  }

  const toggleBlur = () => setState((prev) => ({ ...prev, blurred: !prev.blurred }))

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Corruption Tracker</h2>
        <div className="round-controls">
          <button className={`btn ${state.blurred ? 'btn-accent' : ''}`} onClick={toggleBlur}>
            {state.blurred ? '👁 Reveal Values' : '🙈 Blur Values'}
          </button>
        </div>
      </div>

      <form className="add-combatant-form" onSubmit={addPc}>
        <input
          className="field field-name"
          placeholder="PC name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn btn-accent" type="submit">+ Add PC</button>
      </form>

      {state.pcs.length === 0 ? (
        <p className="empty-state">No PCs tracked yet. Add each player character above.</p>
      ) : (
        <div className="corruption-grid">
          {state.pcs.map((pc) => (
            <div className="corruption-card" key={pc.id}>
              <div className="corruption-card-header">
                <input
                  className="field field-inline field-name"
                  value={pc.name}
                  onChange={(e) => updateName(pc.id, e.target.value)}
                />
                <button className="btn btn-danger btn-small" onClick={() => removePc(pc.id)}>✕</button>
              </div>

              <div className="corruption-meter-row">
                <button className="pip-btn" onClick={() => adjustCorruption(pc.id, -1)} aria-label="decrease corruption">−</button>
                <div className={`corruption-pips ${state.blurred ? 'is-blurred' : ''}`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={`corruption-pip ${n <= pc.corruption ? 'filled' : ''} level-${n}`} />
                  ))}
                </div>
                <button className="pip-btn" onClick={() => adjustCorruption(pc.id, 1)} aria-label="increase corruption">+</button>
                <span className={`corruption-count ${state.blurred ? 'is-blurred' : ''}`}>{pc.corruption} / 5</span>
              </div>

              {pc.corruption >= 3 && (
                <p className={`corruption-hint threshold-${pc.corruption} ${state.blurred ? 'is-blurred' : ''}`}>
                  {THRESHOLD_HINTS[pc.corruption]}
                </p>
              )}

              <textarea
                className="field corruption-notes"
                placeholder="Notes (triggers, symptoms, Narrator reminders...)"
                value={pc.notes}
                onChange={(e) => updateNotes(pc.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
