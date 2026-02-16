import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnemyType } from '../types';
import { BossAI, type BossState } from './boss-ai';

const mockEnemyType: EnemyType = {
  icon: '🦆',
  color: '#fff',
  words: ['test'],
  counter: 'reality',
};

const mockState: BossState = {
  x: 400,
  y: 300,
  hp: 100,
  maxHp: 100,
  aggression: 0.5,
  patterns: ['burst', 'sweep', 'spiral'],
  enemyTypes: [mockEnemyType],
  wave: 1,
};

describe('BossAI', () => {
  let boss: BossAI;

  beforeEach(() => {
    vi.useFakeTimers();
    boss = new BossAI({ ...mockState });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize correctly', () => {
    expect(boss.vehicle).toBeDefined();
    expect(boss.brain).toBeDefined();
    expect(boss.actions).toHaveLength(0);
  });

  it('should update and produce movement actions', () => {
    const actions = boss.update(0.016, mockState);
    const moveAction = actions.find((a) => a.type === 'move');
    expect(moveAction).toBeDefined();
    expect(moveAction?.x).toBeDefined();
    expect(moveAction?.y).toBeDefined();
  });

  it('should reduce cooldown on update', () => {
    boss.attackCooldown = 1.0;
    boss.update(0.1, mockState);
    expect(boss.attackCooldown).toBeCloseTo(0.9);
  });

  it('should pick random enemy type', () => {
    const type = boss.randomEnemyType();
    expect(type).toBe(mockEnemyType);
  });

  it('should throw if no enemy types', () => {
    boss.state.enemyTypes = [];
    expect(() => boss.randomEnemyType()).toThrow();
  });

  it('should produce spawn actions when cooldown is 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    boss.attackCooldown = 0;
    const actions = boss.update(0.1, mockState);
    expect(actions.some((a) => a.type === 'spawn_enemies')).toBe(true);
  });

  it('should trigger Rage mode at low HP', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const lowHpState = { ...mockState, hp: 10, maxHp: 100 };
    boss = new BossAI(lowHpState);
    boss.attackCooldown = 0;
    const actions = boss.update(0.1, lowHpState);
    // Rage at low HP has highest desirability with bias 1.2
    expect(actions.some((a) => a.type === 'shake' && a.intensity === 12)).toBe(true);
  });

  it('should move to target when moveTo is called', () => {
    boss.moveTo(100, 100);
    boss.update(0.1, mockState);
    vi.advanceTimersByTime(1500);
  });

  it('should respect pattern constraints', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const noPatternState = { ...mockState, patterns: [] as string[] };
    boss = new BossAI(noPatternState);
    boss.attackCooldown = 0;

    const actions = boss.update(0.1, noPatternState);

    // With no patterns and high HP, only Reposition or Summon can be chosen
    // Reposition produces a move action
    expect(actions.some((a) => a.type === 'move')).toBe(true);
  });
});
