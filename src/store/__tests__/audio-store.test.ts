import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock tone module to avoid ESM resolution issues in test environment
vi.mock('tone', () => ({
  start: vi.fn(),
  Gain: vi.fn(() => ({ toDestination: vi.fn(() => ({})) })),
  Oscillator: vi.fn(() => ({ connect: vi.fn(), start: vi.fn() })),
  Filter: vi.fn(() => ({ connect: vi.fn() })),
  PolySynth: vi.fn(() => ({ connect: vi.fn() })),
  Synth: vi.fn(),
  AmplitudeEnvelope: vi.fn(() => ({ connect: vi.fn() })),
  Noise: vi.fn(() => ({ connect: vi.fn(), start: vi.fn() })),
  MetalSynth: vi.fn(() => ({ connect: vi.fn() })),
  Loop: vi.fn(() => ({ start: vi.fn() })),
  getTransport: vi.fn(() => ({
    bpm: { value: 120 },
    start: vi.fn(),
    stop: vi.fn(),
    cancel: vi.fn(),
  })),
}));

import { useAudioStore } from '../audio-store';

describe('audio-store', () => {
  beforeEach(() => {
    useAudioStore.setState({
      isInitialized: false,
      tension: 0.12,
    });
  });

  it('initial state is not initialized with tension 0.12', () => {
    const s = useAudioStore.getState();
    expect(s.isInitialized).toBe(false);
    expect(s.tension).toBe(0.12);
  });

  it('updateTension changes tension value', () => {
    useAudioStore.getState().updateTension(0.5);
    expect(useAudioStore.getState().tension).toBe(0.5);
  });

  it('shutdown does not throw when not initialized', () => {
    expect(() => useAudioStore.getState().shutdown()).not.toThrow();
  });
});
