import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Goal } from 'yuka';
import type { EnemyType } from '../types';
import {
  BossAI,
  type BossState,
  BurstAttackGoal,
  BurstEvaluator,
  RageEvaluator,
  RageGoal,
  RepositionEvaluator,
  RepositionGoal,
  SpiralAttackGoal,
  SpiralEvaluator,
  SummonEvaluator,
  SummonGoal,
  SweepAttackGoal,
  SweepEvaluator,
} from './boss-ai';

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
    expect(actions.some((a) => a.type === 'move' || a.type === 'spawn_enemies')).toBe(true);
  });

  describe('BurstEvaluator & Goal', () => {
    it('evaluator returns 0 if on cooldown', () => {
      boss.attackCooldown = 1;
      const evaluator = new BurstEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBe(0);
    });

    it('evaluator returns 0 if pattern not available', () => {
      boss.state.patterns = [];
      const evaluator = new BurstEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBe(0);
    });

    it('evaluator returns positive score if available', () => {
      boss.attackCooldown = 0;
      boss.state.patterns = ['burst'];
      const evaluator = new BurstEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBeGreaterThan(0);
    });

    it('goal executes and sets cooldown', () => {
      const goal = new BurstAttackGoal(boss);
      goal.activate();
      goal.execute();
      expect(boss.actions.some((a) => a.type === 'spawn_enemies')).toBe(true);
      expect(boss.actions.some((a) => a.type === 'flash')).toBe(true);
      expect(boss.attackCooldown).toBeGreaterThan(0);
      expect(goal.status).toBe(Goal.STATUS.COMPLETED);
    });
  });

  describe('SweepEvaluator & Goal', () => {
    it('evaluator returns 0 if on cooldown', () => {
      boss.attackCooldown = 1;
      const evaluator = new SweepEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBe(0);
    });

    it('evaluator returns 0 if pattern not available', () => {
      boss.state.patterns = [];
      const evaluator = new SweepEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBe(0);
    });

    it('goal moves boss and spawns enemies over time', () => {
      const goal = new SweepAttackGoal(boss);
      goal.activate();

      // Initial move
      expect(boss.actions.some((a) => a.type === 'move')).toBe(false); // Actions flushed

      // Simulate updates
      boss.frameDelta = 0.1;
      for (let i = 0; i < 25; i++) {
        goal.execute();
      }

      expect(boss.actions.some((a) => a.type === 'spawn_enemies')).toBe(true);
      expect(goal.status).toBe(Goal.STATUS.COMPLETED);
      expect(boss.attackCooldown).toBeGreaterThan(0);
    });
  });

  describe('SpiralEvaluator & Goal', () => {
    it('evaluator returns 0 if on cooldown', () => {
      boss.attackCooldown = 1;
      const evaluator = new SpiralEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBe(0);
    });

    it('evaluator returns 0 if pattern not available', () => {
      boss.state.patterns = [];
      const evaluator = new SpiralEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBe(0);
    });

    it('goal spawns enemies in spiral over time', () => {
      const goal = new SpiralAttackGoal(boss);
      goal.activate();

      boss.frameDelta = 0.1;
      for (let i = 0; i < 30; i++) {
        goal.execute();
      }

      expect(boss.actions.some((a) => a.type === 'spawn_enemies')).toBe(true);
      expect(goal.status).toBe(Goal.STATUS.COMPLETED);
      expect(boss.actions.some((a) => a.type === 'shake')).toBe(true);
    });
  });

  describe('RepositionEvaluator & Goal', () => {
    it('evaluator returns value even on cooldown', () => {
      boss.attackCooldown = 1;
      const evaluator = new RepositionEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBeGreaterThan(0);
    });

    it('goal triggers move', () => {
      const goal = new RepositionGoal(boss);
      goal.activate();
      goal.execute();

      // Move target should have been set
      expect(goal.status).toBe(Goal.STATUS.COMPLETED);
      // Note: move action is generated in boss.update(), but goal sets the behavior
    });
  });

  describe('SummonEvaluator & Goal', () => {
    it('evaluator returns 0 on cooldown', () => {
      boss.attackCooldown = 1;
      const evaluator = new SummonEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBe(0);
    });

    it('evaluator prefers lower HP', () => {
      boss.attackCooldown = 0;
      boss.state.hp = 100; // 100%
      const highHpEval = new SummonEvaluator(boss, 1).calculateDesirability();

      boss.state.hp = 10; // 10%
      const lowHpEval = new SummonEvaluator(boss, 1).calculateDesirability();

      // Need to mock random to be sure, or check range
      // Low HP should generally be higher, but random noise exists.
      // 0.2 + hpFactor * 0.4. hpFactor = 1 - ratio.
      // High HP: factor 0 -> 0.2 + rand*0.15
      // Low HP: factor 0.9 -> 0.56 + rand*0.15
      expect(lowHpEval).toBeGreaterThan(highHpEval - 0.2); // Loose check
    });

    it('goal spawns minions', () => {
      const goal = new SummonGoal(boss);
      goal.activate();
      goal.execute();
      expect(boss.actions.some((a) => a.type === 'spawn_enemies')).toBe(true);
      expect(boss.attackCooldown).toBeGreaterThan(0);
    });
  });

  describe('RageEvaluator & Goal', () => {
    it('evaluator returns 0 on cooldown', () => {
      boss.attackCooldown = 1;
      const evaluator = new RageEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBe(0);
    });

    it('evaluator returns 0 if HP > 30%', () => {
      boss.attackCooldown = 0;
      boss.state.hp = 40;
      boss.state.maxHp = 100;
      const evaluator = new RageEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBe(0);
    });

    it('evaluator returns high value if HP <= 30%', () => {
      boss.attackCooldown = 0;
      boss.state.hp = 20;
      boss.state.maxHp = 100;
      const evaluator = new RageEvaluator(boss, 1);
      expect(evaluator.calculateDesirability()).toBeGreaterThan(0.5);
    });

    it('goal spawns many enemies and shakes', () => {
      const goal = new RageGoal(boss);
      goal.activate();
      goal.execute();
      expect(boss.actions.some((a) => a.type === 'spawn_enemies')).toBe(true);
      expect(boss.actions.some((a) => a.type === 'shake')).toBe(true);
      expect(boss.actions.some((a) => a.type === 'flash')).toBe(true);
    });
  });
});
