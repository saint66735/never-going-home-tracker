import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useCombat } from '../context/CombatContext'

const STORAGE_KEY = 'ngh-characters'

const ATTRIBUTES = [
  { key: 'brawn', label: 'Brawn', desc: 'Strength, Flexibility, Physical Health' },
  { key: 'smarts', label: 'Smarts', desc: 'Intelligence, Knowledge, Mental Health' },
  { key: 'guts', label: 'Guts', desc: 'Courage, Willpower, Emotional Health' },
]

const SKILLS = [
  { key: 'athletics', name: 'Athletics', attr: 'Brawn', short: 'Lift, run, smash', full: 'Used for all acts of movement, speed, grace, feats of strength and tests of pain or physical endurance.' },
  { key: 'melee', name: 'Melee', attr: 'Brawn', short: 'Use hand-to-hand weapons', full: 'Covers kicks and punches, wrestling, sword fights and bar room brawls.' },
  { key: 'stealth', name: 'Stealth', attr: 'Brawn', short: 'Be quiet, stay hidden', full: 'Concealment in all forms; moving lightly, breathing quietly, getting behind cover. Can also be used when palming objects or setting camouflage.' },
  { key: 'communications', name: 'Communications', attr: 'Smarts', short: 'Speak, write', full: 'Represents both technical knowledge such as alphabets and how to operate a radio, as well as emotional aspects, such as reading body language and being persuasive.' },
  { key: 'knowledge', name: 'Knowledge', attr: 'Smarts', short: 'Book learning', full: 'Anything which can be studied and remembered; baseball statistics, ancient history, camp rumors, terrain maps, bird species, how to treat shock, etc.' },
  { key: 'mechanics', name: 'Mechanics', attr: 'Smarts', short: 'Build, use, fix machines', full: 'Includes the skills of diagnosing problems, reading diagrams, improvising parts, and making repairs for any device; as well as using them.' },
  { key: 'investigation', name: 'Investigation', attr: 'Guts', short: 'Find answers', full: "Used to search a room, to pump a local for information, or to force a prisoner to confess. Can also be used to read one's own intuition." },
  { key: 'ranged', name: 'Ranged', attr: 'Guts', short: 'Use guns, thrown weapons', full: 'Covers everything that hits what it’s pointed at, from spit wads to artillery.' },
  { key: 'transport', name: 'Transport', attr: 'Guts', short: 'Operate vehicles', full: 'Anything related to the operation of vehicles; taking curves on a motorcycle, driving down a mountain in a truck, tacking into the wind on a sailboat.' },
  { key: 'whisper', name: 'Whisper', attr: 'Variable', short: 'Use magic', full: 'Represents both specific knowledge of a Whisper path, and overall experience with occult history, symbols, and methods.' },
]

const RANDOM_FIRST_NAMES = ['Thomas', 'Arthur', 'William', 'George', 'Albert', 'Harold', 'Frederick', 'Ernest', 'Walter', 'Herbert', 'Alfred', 'Sidney', 'Edith', 'Florence', 'Mabel', 'Nora', 'Winifred', 'Gladys', 'Alice', 'Edna']
const RANDOM_LAST_NAMES = ['Wilkins', 'Carter', 'Higgins', 'Mercer', 'Doyle', 'Fenwick', 'Ashworth', 'Pratt', 'Sullivan', 'Marsh', 'Barrow', 'Whitfield', 'Cobb', 'Nash', 'Lockhart', 'Pruitt', 'Tolliver', 'Eastman', 'Griggs', 'Hawes']

const initialState = { characters: [] }

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomPartition(total, slots) {
  const arr = new Array(slots).fill(0)
  for (let i = 0; i < total; i++) {
    arr[Math.floor(Math.random() * slots)] += 1
  }
  return arr
}

function emptyDraft() {
  return {
    id: null,
    name: '',
    gender: '',
    sexuality: '',
    attributes: { brawn: 4, smarts: 3, guts: 3 },
    trainedSkills: [],
    skillDice: {},
    whisperPaths: [],
    equipment: '',
    serviceRecord: '',
    personalHistory: '',
  }
}

function cloneForEdit(c) {
  return {
    ...c,
    attributes: { ...c.attributes },
    skillDice: { ...c.skillDice },
    whisperPaths: c.whisperPaths.map((p) => ({ ...p, spells: [...p.spells] })),
  }
}

function totalDice(skillDice) {
  return Object.values(skillDice).reduce((a, b) => a + b, 0)
}

function StatBox({ label, value }) {
  return (
    <div className="stat-box">
      <span className="stat-box-label">{label}</span>
      <span className="stat-box-value">{value}</span>
    </div>
  )
}

export default function CharacterCreation() {
  const { addCombatant } = useCombat()
  const [state, setState] = useLocalStorage(STORAGE_KEY, initialState)
  const [draft, setDraft] = useState(emptyDraft)

  const attrTotal = draft.attributes.brawn + draft.attributes.smarts + draft.attributes.guts
  const attrRemaining = 10 - attrTotal
  const diceTotal = totalDice(draft.skillDice)
  const diceRemaining = 3 - diceTotal
  const whisperDiceTotal = draft.skillDice.whisper || 0
  const whisperDiceUsed = draft.whisperPaths.reduce((a, p) => a + p.dice, 0)
  const whisperDiceRemaining = whisperDiceTotal - whisperDiceUsed
  const whisperOk = whisperDiceTotal === 0 || whisperDiceUsed === whisperDiceTotal

  const missing = []
  if (!draft.name.trim()) missing.push('a name')
  if (attrTotal !== 10) missing.push('10 attribute points spent')
  if (draft.trainedSkills.length !== 3) missing.push('exactly 3 trained skills')
  if (diceTotal !== 3) missing.push('3 skill dice assigned')
  if (!whisperOk) missing.push('all Whisper dice assigned to a Path')
  const isValid = missing.length === 0

  const adjustAttribute = (key, delta) => {
    setDraft((prev) => {
      const cur = prev.attributes[key]
      const next = cur + delta
      if (next < 1) return prev
      const total = prev.attributes.brawn + prev.attributes.smarts + prev.attributes.guts - cur + next
      if (total > 10) return prev
      return { ...prev, attributes: { ...prev.attributes, [key]: next } }
    })
  }

  const toggleSkill = (key) => {
    setDraft((prev) => {
      const isTrained = prev.trainedSkills.includes(key)
      if (isTrained) {
        const trainedSkills = prev.trainedSkills.filter((k) => k !== key)
        const skillDice = { ...prev.skillDice }
        delete skillDice[key]
        const whisperPaths = key === 'whisper' ? [] : prev.whisperPaths
        return { ...prev, trainedSkills, skillDice, whisperPaths }
      }
      if (prev.trainedSkills.length >= 3) return prev
      return { ...prev, trainedSkills: [...prev.trainedSkills, key], skillDice: { ...prev.skillDice, [key]: 0 } }
    })
  }

  const adjustDie = (key, delta) => {
    setDraft((prev) => {
      const cur = prev.skillDice[key] || 0
      const next = cur + delta
      if (next < 0 || next > 3) return prev
      const othersTotal = totalDice(prev.skillDice) - cur
      if (othersTotal + next > 3) return prev
      const skillDice = { ...prev.skillDice, [key]: next }
      let whisperPaths = prev.whisperPaths
      if (key === 'whisper') {
        let running = 0
        whisperPaths = prev.whisperPaths.map((p) => {
          const remaining = Math.max(0, next - running)
          const dice = Math.min(p.dice, remaining)
          running += dice
          const spells = p.spells.slice(0, dice)
          while (spells.length < dice) spells.push('')
          return { ...p, dice, spells }
        })
      }
      return { ...prev, skillDice, whisperPaths }
    })
  }

  const addWhisperPath = () => {
    setDraft((prev) => {
      if (prev.whisperPaths.length >= 3) return prev
      return { ...prev, whisperPaths: [...prev.whisperPaths, { id: makeId('wp'), path: '', dice: 0, spells: [] }] }
    })
  }

  const removeWhisperPath = (id) => {
    setDraft((prev) => ({ ...prev, whisperPaths: prev.whisperPaths.filter((p) => p.id !== id) }))
  }

  const updateWhisperPath = (id, patch) => {
    setDraft((prev) => ({ ...prev, whisperPaths: prev.whisperPaths.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  }

  const adjustWhisperDice = (id, delta) => {
    setDraft((prev) => {
      const path = prev.whisperPaths.find((p) => p.id === id)
      if (!path) return prev
      const next = path.dice + delta
      if (next < 0) return prev
      const othersTotal = prev.whisperPaths.filter((p) => p.id !== id).reduce((a, p) => a + p.dice, 0)
      if (othersTotal + next > (prev.skillDice.whisper || 0)) return prev
      const spells = path.spells.slice(0, next)
      while (spells.length < next) spells.push('')
      return { ...prev, whisperPaths: prev.whisperPaths.map((p) => (p.id === id ? { ...p, dice: next, spells } : p)) }
    })
  }

  const updateSpell = (pathId, idx, value) => {
    setDraft((prev) => ({
      ...prev,
      whisperPaths: prev.whisperPaths.map((p) => (p.id === pathId ? { ...p, spells: p.spells.map((s, i) => (i === idx ? value : s)) } : p)),
    }))
  }

  const randomize = () => {
    setDraft((prev) => {
      const shuffled = [...SKILLS].sort(() => Math.random() - 0.5)
      const trainedSkills = shuffled.slice(0, 3).map((s) => s.key)
      const diceSplit = randomPartition(3, 3)
      const skillDice = {}
      trainedSkills.forEach((k, i) => { skillDice[k] = diceSplit[i] })
      const whisperDice = skillDice.whisper || 0
      const whisperPaths = whisperDice > 0
        ? [{ id: makeId('wp'), path: '', dice: whisperDice, spells: Array(whisperDice).fill('') }]
        : []
      const [b, s, g] = randomPartition(7, 3)
      return {
        ...prev,
        name: `${pick(RANDOM_FIRST_NAMES)} ${pick(RANDOM_LAST_NAMES)}`,
        attributes: { brawn: 1 + b, smarts: 1 + s, guts: 1 + g },
        trainedSkills,
        skillDice,
        whisperPaths,
      }
    })
  }

  const handleSave = () => {
    if (!isValid) return
    setState((prev) => {
      if (draft.id) {
        return { ...prev, characters: prev.characters.map((c) => (c.id === draft.id ? { ...draft } : c)) }
      }
      return { ...prev, characters: [...prev.characters, { ...draft, id: makeId('char') }] }
    })
    setDraft(emptyDraft())
  }

  const loadForEdit = (c) => setDraft(cloneForEdit(c))

  const deleteCharacter = (id) => {
    setState((prev) => ({ ...prev, characters: prev.characters.filter((c) => c.id !== id) }))
    if (draft.id === id) setDraft(emptyDraft())
  }

  const quickAddToCombat = (c) => {
    addCombatant({
      name: c.name,
      type: 'PC',
      brawn: c.attributes.brawn,
      smarts: c.attributes.smarts,
      guts: c.attributes.guts,
      armor: 'None',
      initiative: '',
    })
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <h2>{draft.id ? 'Edit Soldier Record' : 'Character Creation'}</h2>
          <div className="round-controls">
            <button className="btn btn-accent" onClick={randomize}>🎲 Randomize</button>
            {draft.id && <button className="btn" onClick={() => setDraft(emptyDraft())}>Cancel Edit</button>}
            {!draft.id && <button className="btn" onClick={() => setDraft(emptyDraft())}>Clear</button>}
          </div>
        </div>

        <div className="chargen-grid">
          <div className="chargen-col">
            <input
              className="field field-name"
              placeholder="Name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <div className="chargen-inline-fields">
              <input
                className="field field-narrow"
                placeholder="Gender"
                value={draft.gender}
                onChange={(e) => setDraft({ ...draft, gender: e.target.value })}
              />
              <input
                className="field field-narrow"
                placeholder="Sexuality"
                value={draft.sexuality}
                onChange={(e) => setDraft({ ...draft, sexuality: e.target.value })}
              />
            </div>

            <h3>Recruitment</h3>
            <p className="chargen-hint">Divide 10 points among Brawn, Smarts, and Guts. Minimum 1 each. Average human ability is 3; peak is 6.</p>
            {ATTRIBUTES.map((attr) => (
              <div className="attribute-row" key={attr.key}>
                <div className="attribute-label">
                  <span className="attribute-name">{attr.label}</span>
                  <span className="attribute-desc">{attr.desc}</span>
                </div>
                <div className="dice-stepper">
                  <button className="pip-btn" onClick={() => adjustAttribute(attr.key, -1)} disabled={draft.attributes[attr.key] <= 1}>−</button>
                  <span className="track-value">{draft.attributes[attr.key]}</span>
                  <button className="pip-btn" onClick={() => adjustAttribute(attr.key, 1)} disabled={attrRemaining <= 0}>+</button>
                </div>
              </div>
            ))}
            <p className={`chargen-remaining ${attrRemaining !== 0 ? 'warn' : 'ok'}`}>{attrRemaining} attribute point{attrRemaining === 1 ? '' : 's'} remaining</p>

            <h3>Assigned Equipment</h3>
            <textarea
              className="field corruption-notes"
              placeholder="Rifle, helmet, gas mask, trench kit..."
              value={draft.equipment}
              onChange={(e) => setDraft({ ...draft, equipment: e.target.value })}
            />

            <h3>Service Record</h3>
            <textarea
              className="field corruption-notes"
              placeholder="Unit, rank, postings, notable actions..."
              value={draft.serviceRecord}
              onChange={(e) => setDraft({ ...draft, serviceRecord: e.target.value })}
            />

            <h3>Personal History</h3>
            <textarea
              className="field corruption-notes"
              placeholder="Where they're from, who they left behind, why they enlisted..."
              value={draft.personalHistory}
              onChange={(e) => setDraft({ ...draft, personalHistory: e.target.value })}
            />
          </div>

          <div className="chargen-col">
            <h3>Training</h3>
            <p className="chargen-hint">Select three trained skills, then assign three Skill Dice among them (e.g. 3/0/0, 2/1/0, or 1/1/1).</p>
            {SKILLS.map((skill) => {
              const trained = draft.trainedSkills.includes(skill.key)
              return (
                <div className="skill-row" key={skill.key}>
                  <label className="skill-label" title={skill.full}>
                    <input
                      type="checkbox"
                      checked={trained}
                      onChange={() => toggleSkill(skill.key)}
                      disabled={!trained && draft.trainedSkills.length >= 3}
                    />
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-attr">[{skill.attr}]</span>
                    <span className="skill-desc">{skill.short}</span>
                  </label>
                  {trained && (
                    <div className="dice-stepper">
                      <button className="pip-btn" onClick={() => adjustDie(skill.key, -1)} disabled={(draft.skillDice[skill.key] || 0) <= 0}>−</button>
                      <span className="track-value">{draft.skillDice[skill.key] || 0}</span>
                      <button className="pip-btn" onClick={() => adjustDie(skill.key, 1)} disabled={diceRemaining <= 0}>+</button>
                    </div>
                  )}
                </div>
              )
            })}
            <p className={`chargen-remaining ${diceRemaining !== 0 ? 'warn' : 'ok'}`}>{diceRemaining} skill di{diceRemaining === 1 ? 'e' : 'ce'} remaining</p>

            {draft.trainedSkills.includes('whisper') && (
              <div className="whisper-block">
                <h4>Whisper Paths</h4>
                <p className="chargen-hint">Assign Whisper dice across up to three Paths. Each Path grants one spell per die trained in it.</p>
                <p className={`chargen-remaining ${whisperDiceRemaining !== 0 ? 'warn' : 'ok'}`}>{whisperDiceRemaining} of {whisperDiceTotal} whisper dice unassigned</p>
                {draft.whisperPaths.map((p) => (
                  <div className="whisper-path-row" key={p.id}>
                    <div className="whisper-path-header">
                      <input
                        className="field field-inline field-name"
                        placeholder="Path name"
                        value={p.path}
                        onChange={(e) => updateWhisperPath(p.id, { path: e.target.value })}
                      />
                      <div className="dice-stepper">
                        <button className="pip-btn" onClick={() => adjustWhisperDice(p.id, -1)} disabled={p.dice <= 0}>−</button>
                        <span className="track-value">{p.dice}</span>
                        <button className="pip-btn" onClick={() => adjustWhisperDice(p.id, 1)} disabled={whisperDiceRemaining <= 0}>+</button>
                      </div>
                      <button className="btn btn-danger btn-small" onClick={() => removeWhisperPath(p.id)}>✕</button>
                    </div>
                    {p.spells.length > 0 && (
                      <div className="whisper-spells">
                        {p.spells.map((s, i) => (
                          <input
                            key={i}
                            className="field field-inline"
                            placeholder={`Spell ${i + 1}`}
                            value={s}
                            onChange={(e) => updateSpell(p.id, i, e.target.value)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {draft.whisperPaths.length < 3 && whisperDiceRemaining > 0 && (
                  <button className="btn btn-small" onClick={addWhisperPath}>+ Add Path</button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="round-controls chargen-save-row">
          <button
            className="btn btn-accent"
            onClick={handleSave}
            disabled={!isValid}
            title={isValid ? 'Save to roster' : `Missing: ${missing.join(', ')}`}
          >
            💾 {draft.id ? 'Update Record' : 'Save to Roster'}
          </button>
          {!isValid && <span className="pending-note">Missing: {missing.join(', ')}</span>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Roster</h2>
        </div>
        {state.characters.length === 0 ? (
          <p className="empty-state">No characters created yet. Fill out the form above (or hit Randomize) and save.</p>
        ) : (
          <div className="monster-grid">
            {state.characters.map((c) => (
              <article className="monster-card category-mundane" key={c.id}>
                <header className="monster-card-header">
                  <div>
                    <h3>{c.name}</h3>
                    {(c.gender || c.sexuality) && (
                      <p className="monster-aliases">{[c.gender, c.sexuality].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <button className="btn btn-danger btn-small" onClick={() => deleteCharacter(c.id)}>✕</button>
                </header>

                <div className="monster-stats">
                  <StatBox label="Brawn" value={c.attributes.brawn} />
                  <StatBox label="Smarts" value={c.attributes.smarts} />
                  <StatBox label="Guts" value={c.attributes.guts} />
                </div>

                <div className="monster-section">
                  <h4>Training</h4>
                  <ul>
                    {c.trainedSkills.map((k) => {
                      const skill = SKILLS.find((s) => s.key === k)
                      const dice = c.skillDice[k] || 0
                      return <li key={k}>{skill ? skill.name : k} — {dice} {dice === 1 ? 'die' : 'dice'}</li>
                    })}
                  </ul>
                </div>

                {c.whisperPaths.length > 0 && (
                  <div className="monster-section">
                    <h4>Whisper</h4>
                    <ul>
                      {c.whisperPaths.map((p) => (
                        <li key={p.id}>
                          {p.path || 'Untitled Path'} ({p.dice})
                          {p.spells.some(Boolean) && <span className="note-text"> — {p.spells.filter(Boolean).join(', ')}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.equipment && (
                  <div className="monster-section">
                    <h4>Assigned Equipment</h4>
                    <p>{c.equipment}</p>
                  </div>
                )}
                {c.serviceRecord && (
                  <div className="monster-section">
                    <h4>Service Record</h4>
                    <p>{c.serviceRecord}</p>
                  </div>
                )}
                {c.personalHistory && (
                  <div className="monster-section">
                    <h4>Personal History</h4>
                    <p>{c.personalHistory}</p>
                  </div>
                )}

                <div className="round-controls">
                  <button className="btn" onClick={() => loadForEdit(c)}>Edit</button>
                  <button className="btn btn-accent quick-add-btn" onClick={() => quickAddToCombat(c)}>+ Quick Add to Combat</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
