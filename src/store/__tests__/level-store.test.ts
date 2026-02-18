import { beforeEach, describe, expect, it } from 'vitest';
import { useLevelStore } from '../level-store';

describe('level-store', () => {
  beforeEach(() => {
    useLevelStore.getState().reset();
  });

  it('has correct initial state', () => {
    const s = useLevelStore.getState();
    expect(s.currentLevel).toBe(1);
    expect(s.coherence).toBe(25);
    expect(s.peakCoherence).toBe(25);
    expect(s.tension).toBe(0);
  });

  it('addCoherence increases coherence', () => {
    useLevelStore.getState().addCoherence(10);
    expect(useLevelStore.getState().coherence).toBe(35);
  });

  it('addCoherence caps at 100', () => {
    useLevelStore.getState().addCoherence(200);
    expect(useLevelStore.getState().coherence).toBe(100);
  });

  it('addCoherence updates peakCoherence when exceeding', () => {
    useLevelStore.getState().addCoherence(50);
    expect(useLevelStore.getState().peakCoherence).toBe(75);
    // Reducing coherence should not reduce peak
    useLevelStore.getState().addCoherence(-30);
    expect(useLevelStore.getState().peakCoherence).toBe(75);
  });

  it('setTension clamps to 0', () => {
    useLevelStore.getState().setTension(-1);
    expect(useLevelStore.getState().tension).toBe(0);
  });

  it('setTension clamps to 1', () => {
    useLevelStore.getState().setTension(2);
    expect(useLevelStore.getState().tension).toBe(1);
  });

  it('setTension sets value in range', () => {
    useLevelStore.getState().setTension(0.75);
    expect(useLevelStore.getState().tension).toBe(0.75);
  });

  it('advanceLevel increments level and adds coherence', () => {
    useLevelStore.getState().advanceLevel();
    expect(useLevelStore.getState().currentLevel).toBe(2);
    expect(useLevelStore.getState().coherence).toBe(33); // 25 + 8
  });

  it('reset returns to initial state', () => {
    useLevelStore.getState().setTension(0.9);
    useLevelStore.getState().addCoherence(50);
    useLevelStore.getState().advanceLevel();
    useLevelStore.getState().reset();

    const s = useLevelStore.getState();
    expect(s.currentLevel).toBe(1);
    expect(s.coherence).toBe(25);
    expect(s.tension).toBe(0);
    expect(s.timeSurvived).toBe(0);
  });

  it('decayTension reduces tension over time', () => {
    useLevelStore.getState().setTension(0.5);
    useLevelStore.getState().decayTension(1.0); // 1 second
    const t = useLevelStore.getState().tension;
    expect(t).toBeLessThan(0.5);
    expect(t).toBeGreaterThan(0);
  });

  it('decayTension does not go below zero', () => {
    useLevelStore.getState().setTension(0.01);
    useLevelStore.getState().decayTension(10);
    expect(useLevelStore.getState().tension).toBe(0);
  });

  it('stabilizeTension reduces tension by amount', () => {
    useLevelStore.getState().setTension(0.5);
    useLevelStore.getState().stabilizeTension(0.1);
    expect(useLevelStore.getState().tension).toBeCloseTo(0.4);
  });

  it('stabilizeTension does not go below zero', () => {
    useLevelStore.getState().setTension(0.05);
    useLevelStore.getState().stabilizeTension(0.2);
    expect(useLevelStore.getState().tension).toBe(0);
  });

  it('addTime accumulates survival time', () => {
    useLevelStore.getState().addTime(5);
    expect(useLevelStore.getState().timeSurvived).toBe(5);
  });

  it('addTime auto-advances level at 30s intervals', () => {
    useLevelStore.getState().addTime(31);
    expect(useLevelStore.getState().currentLevel).toBe(2);
  });

  it('initial timeSurvived is 0', () => {
    expect(useLevelStore.getState().timeSurvived).toBe(0);
  });
});
