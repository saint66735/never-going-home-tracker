import { useState } from 'react'
import './index.css'
import { CombatProvider } from './context/CombatContext'
import CombatTracker from './components/CombatTracker'
import CharacterCreation from './components/CharacterCreation'
import CorruptionTracker from './components/CorruptionTracker'
import MonsterBrowser from './components/MonsterBrowser'

const TABS = [
  { key: 'combat', label: 'Combat Tracker' },
  { key: 'characters', label: 'Character Creation' },
  { key: 'corruption', label: 'Corruption' },
  { key: 'bestiary', label: 'Bestiary' },
]

function App() {
  const [activeTab, setActiveTab] = useState('combat')

  return (
    <CombatProvider>
      <div className="app-shell">
        <header className="app-header">
          <h1>Never Going Home</h1>
          <p className="app-subtitle">Narrator's Field Kit</p>
        </header>

        <nav className="tab-nav">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="app-main">
          {activeTab === 'combat' && <CombatTracker />}
          {activeTab === 'characters' && <CharacterCreation />}
          {activeTab === 'corruption' && <CorruptionTracker />}
          {activeTab === 'bestiary' && <MonsterBrowser onQuickAdd={() => setActiveTab('combat')} />}
        </main>
      </div>
    </CombatProvider>
  )
}

export default App
