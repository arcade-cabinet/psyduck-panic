import { create } from 'zustand';

interface LevelState {
  currentLevel: number;
  coherence: number;
  peakCoherence: number;
  tension: number;
  /** Cumulative time survived (seconds) — drives level advancement */
  timeSurvived: number;

  advanceLevel: () => void;
  addCoherence: (amount: number) => void;
  setTension: (value: number) => void;
  /** Apply natural tension decay over dt seconds */
  decayTension: (dt: number) => void;
  /** Reduce tension when a pattern is successfully stabilized */
  stabilizeTension: (amount: number) => void;
  /** Accumulate survival time, auto-advance levels */
  addTime: (dt: number) => void;
  reset: () => void;
}

/** Seconds per level — logarithmic escalation */
const LEVEL_INTERVAL = 30;

export const useLevelStore = create<LevelState>((set, get) => ({
  currentLevel: 1,
  coherence: 25,
  peakCoherence: 25,
  tension: 0,
  timeSurvived: 0,

  advanceLevel: () => {
    const newLevel = get().currentLevel + 1;
    set({
      currentLevel: newLevel,
      coherence: Math.min(100, get().coherence + 8),
    });
  },

  addCoherence: (amount: number) => {
    const newCoherence = Math.max(0, Math.min(100, get().coherence + amount));
    set({
      coherence: newCoherence,
      peakCoherence: Math.max(get().peakCoherence, newCoherence),
    });
  },

  setTension: (value: number) => {
    set({ tension: Math.max(0, Math.min(1, value)) });
  },

  decayTension: (dt: number) => {
    const cur = get().tension;
    // Natural decay: the mind slowly recovers on its own
    // ~0.04/s at low tension, ~0.12/s at high tension — strong enough to matter
    const rate = 0.04 + cur * 0.08;
    const next = Math.max(0, cur - rate * dt);
    set({ tension: next });
  },

  stabilizeTension: (amount: number) => {
    const cur = get().tension;
    set({ tension: Math.max(0, cur - Math.abs(amount)) });
  },

  addTime: (dt: number) => {
    const newTime = get().timeSurvived + dt;
    const expectedLevel = Math.floor(newTime / LEVEL_INTERVAL) + 1;
    const updates: Partial<LevelState> = { timeSurvived: newTime };
    if (expectedLevel > get().currentLevel) {
      updates.currentLevel = expectedLevel;
      updates.coherence = Math.min(100, get().coherence + 8);
      window.dispatchEvent(new CustomEvent('levelAdvanced', { detail: { level: expectedLevel } }));
    }
    set(updates as LevelState);
  },

  reset: () =>
    set({
      currentLevel: 1,
      coherence: 25,
      peakCoherence: 25,
      tension: 0,
      timeSurvived: 0,
    }),
}));
