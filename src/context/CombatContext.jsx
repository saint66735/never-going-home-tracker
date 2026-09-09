import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const CombatContext = createContext(null)

const STORAGE_KEY = 'ngh-combat-tracker'

const emptyState = {
  round: 1,
  currentTurnId: null,
  combatants: [],
}

function makeId() {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function track(max) {
  const n = Number.isFinite(max) ? max : 0
  return { cur: n, max: n }
}

export function CombatProvider({ children }) {
  const [state, setState] = useLocalStorage(STORAGE_KEY, emptyState)

  const addCombatant = useCallback((partial) => {
    setState((prev) => {
      const combatant = {
        id: makeId(),
        name: partial.name || 'Unnamed',
        type: partial.type || 'Enemy',
        brawn: track(partial.brawn),
        smarts: track(partial.smarts),
        guts: track(partial.guts),
        armor: partial.armor ?? 'None',
        initiative: partial.initiative ?? '',
      }
      return { ...prev, combatants: [...prev.combatants, combatant] }
    })
  }, [setState])

  const removeCombatant = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      combatants: prev.combatants.filter((c) => c.id !== id),
      currentTurnId: prev.currentTurnId === id ? null : prev.currentTurnId,
    }))
  }, [setState])

  const updateCombatant = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      combatants: prev.combatants.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }, [setState])

  const adjustTrack = useCallback((id, trackName, delta) => {
    setState((prev) => ({
      ...prev,
      combatants: prev.combatants.map((c) => {
        if (c.id !== id) return c
        const t = c[trackName]
        const next = Math.max(0, Math.min(t.max, t.cur + delta))
        return { ...c, [trackName]: { ...t, cur: next } }
      }),
    }))
  }, [setState])

  const setTrackMax = useCallback((id, trackName, max) => {
    setState((prev) => ({
      ...prev,
      combatants: prev.combatants.map((c) => {
        if (c.id !== id) return c
        const m = Math.max(0, max)
        return { ...c, [trackName]: { max: m, cur: Math.min(c[trackName].cur, m) } }
      }),
    }))
  }, [setState])

  const moveCombatant = useCallback((id, direction) => {
    setState((prev) => {
      const idx = prev.combatants.findIndex((c) => c.id === id)
      const swapWith = idx + direction
      if (idx < 0 || swapWith < 0 || swapWith >= prev.combatants.length) return prev
      const next = [...prev.combatants]
      ;[next[idx], next[swapWith]] = [next[swapWith], next[idx]]
      return { ...prev, combatants: next }
    })
  }, [setState])

  const sortByInitiative = useCallback(() => {
    setState((prev) => {
      const parseInit = (val) => {
        const match = String(val ?? '').match(/-?\d+(\.\d+)?/)
        return match ? parseFloat(match[0]) : -Infinity
      }
      const next = [...prev.combatants].sort((a, b) => parseInit(b.initiative) - parseInit(a.initiative))
      return { ...prev, combatants: next }
    })
  }, [setState])

  const setCurrentTurnId = useCallback((id) => {
    setState((prev) => ({ ...prev, currentTurnId: id }))
  }, [setState])

  const nextTurn = useCallback(() => {
    setState((prev) => {
      if (prev.combatants.length === 0) return prev
      const idx = prev.combatants.findIndex((c) => c.id === prev.currentTurnId)
      const nextIdx = idx < 0 ? 0 : (idx + 1) % prev.combatants.length
      const wrapped = idx >= 0 && nextIdx === 0
      return {
        ...prev,
        currentTurnId: prev.combatants[nextIdx].id,
        round: wrapped ? prev.round + 1 : prev.round,
      }
    })
  }, [setState])

  const setRound = useCallback((round) => {
    setState((prev) => ({ ...prev, round: Math.max(1, round) }))
  }, [setState])

  const resetCombat = useCallback(() => {
    setState(emptyState)
  }, [setState])

  const value = useMemo(() => ({
    ...state,
    addCombatant,
    removeCombatant,
    updateCombatant,
    adjustTrack,
    setTrackMax,
    moveCombatant,
    sortByInitiative,
    setCurrentTurnId,
    nextTurn,
    setRound,
    resetCombat,
  }), [state, addCombatant, removeCombatant, updateCombatant, adjustTrack, setTrackMax, moveCombatant, sortByInitiative, setCurrentTurnId, nextTurn, setRound, resetCombat])

  return <CombatContext.Provider value={value}>{children}</CombatContext.Provider>
}

export function useCombat() {
  const ctx = useContext(CombatContext)
  if (!ctx) throw new Error('useCombat must be used within CombatProvider')
  return ctx
}
