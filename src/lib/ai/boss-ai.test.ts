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
    // Reposition produces a move action
    expect(actions.some((a) => a.type === 'move')).toBe(true);
  });

  describe('Evaluators', () => {
    it('BurstEvaluator should return 0 if cooldown > 0 or pattern missing', () => {
      const evalutor = new BurstEvaluator(boss, 1.0);
      boss.attackCooldown = 1;
      expect(evalutor.calculateDesirability()).toBe(0);

      boss.attackCooldown = 0;
      boss.state.patterns = [];
      expect(evalutor.calculateDesirability()).toBe(0);

      boss.state.patterns = ['burst'];
      expect(evalutor.calculateDesirability()).toBeGreaterThan(0);
    });

    it('BurstEvaluator.setGoal should add BurstAttackGoal', () => {
      const evalutor = new BurstEvaluator(boss, 1.0);
      const spy = vi.spyOn(boss.brain, 'addSubgoal');
      evalutor.setGoal(boss.vehicle);
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toBeInstanceOf(BurstAttackGoal);
    });

    it('SweepEvaluator should return 0 if cooldown > 0 or pattern missing', () => {
      const evalutor = new SweepEvaluator(boss, 1.0);
      boss.attackCooldown = 1;
      expect(evalutor.calculateDesirability()).toBe(0);

      boss.attackCooldown = 0;
      boss.state.patterns = [];
      expect(evalutor.calculateDesirability()).toBe(0);

      boss.state.patterns = ['sweep'];
      expect(evalutor.calculateDesirability()).toBeGreaterThan(0);
    });

    it('SweepEvaluator.setGoal should add SweepAttackGoal', () => {
      const evalutor = new SweepEvaluator(boss, 1.0);
      const spy = vi.spyOn(boss.brain, 'addSubgoal');
      evalutor.setGoal(boss.vehicle);
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toBeInstanceOf(SweepAttackGoal);
    });

    it('SpiralEvaluator should return 0 if cooldown > 0 or pattern missing', () => {
      const evalutor = new SpiralEvaluator(boss, 1.0);
      boss.attackCooldown = 1;
      expect(evalutor.calculateDesirability()).toBe(0);

      boss.attackCooldown = 0;
      boss.state.patterns = [];
      expect(evalutor.calculateDesirability()).toBe(0);

      boss.state.patterns = ['spiral'];
      expect(evalutor.calculateDesirability()).toBeGreaterThan(0);
    });

    it('SpiralEvaluator.setGoal should add SpiralAttackGoal', () => {
      const evalutor = new SpiralEvaluator(boss, 1.0);
      const spy = vi.spyOn(boss.brain, 'addSubgoal');
      evalutor.setGoal(boss.vehicle);
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toBeInstanceOf(SpiralAttackGoal);
    });

    it('RepositionEvaluator should always return value, higher if cooldown > 0', () => {
      const evalutor = new RepositionEvaluator(boss, 1.0);

      boss.attackCooldown = 1;
      const valCooldown = evalutor.calculateDesirability();

      boss.attackCooldown = 0;
      const valReady = evalutor.calculateDesirability();

      expect(valCooldown).toBeGreaterThan(0);
      expect(valReady).toBeGreaterThan(0);
    });

    it('RepositionEvaluator.setGoal should add RepositionGoal', () => {
      const evalutor = new RepositionEvaluator(boss, 1.0);
      const spy = vi.spyOn(boss.brain, 'addSubgoal');
      evalutor.setGoal(boss.vehicle);
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toBeInstanceOf(RepositionGoal);
    });

    it('SummonEvaluator should scale with HP loss', () => {
      const evalutor = new SummonEvaluator(boss, 1.0);
      boss.attackCooldown = 0;

      boss.state.hp = 100;
      boss.state.maxHp = 100;

      boss.state.hp = 10;

      expect(evalutor.calculateDesirability()).toBeGreaterThan(0);

      boss.attackCooldown = 1;
      expect(evalutor.calculateDesirability()).toBe(0);
    });

    it('SummonEvaluator.setGoal should add SummonGoal', () => {
      const evalutor = new SummonEvaluator(boss, 1.0);
      const spy = vi.spyOn(boss.brain, 'addSubgoal');
      evalutor.setGoal(boss.vehicle);
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toBeInstanceOf(SummonGoal);
    });

    it('RageEvaluator should return 0 if HP > 30%', () => {
      const evalutor = new RageEvaluator(boss, 1.0);
      boss.attackCooldown = 0;
      boss.state.hp = 40;
      boss.state.maxHp = 100;
      expect(evalutor.calculateDesirability()).toBe(0);

      boss.state.hp = 20;
      expect(evalutor.calculateDesirability()).toBeGreaterThan(0);
    });

    it('RageEvaluator.setGoal should add RageGoal', () => {
      const evalutor = new RageEvaluator(boss, 1.0);
      const spy = vi.spyOn(boss.brain, 'addSubgoal');
      evalutor.setGoal(boss.vehicle);
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][0]).toBeInstanceOf(RageGoal);
    });
  });

  describe('Goals', () => {
    it('BurstAttackGoal should spawn enemies and complete', () => {
      const goal = new BurstAttackGoal(boss);
      goal.activate();
      goal.execute();

      expect(boss.actions.some((a) => a.type === 'spawn_enemies')).toBe(true);
      expect(boss.actions.some((a) => a.type === 'flash')).toBe(true);
      expect(goal.status).toBe(Goal.STATUS.COMPLETED);
    });

    it('SweepAttackGoal should spawn enemies over time', () => {
      const goal = new SweepAttackGoal(boss);
      goal.activate();

      // First execution moves the boss
      goal.execute();
      // biome-ignore lint/suspicious/noExplicitAny: access private property for testing
      expect((boss as any).moveTarget).toBeDefined();

      // Simulate time passing
      boss.frameDelta = 0.5; // Simulate time
      goal.execute(); // Should spawn some enemies
      goal.execute();
      goal.execute();
      goal.execute();

      // Keep executing until duration
      boss.frameDelta = 2.0;
      goal.execute();

      expect(boss.actions.some((a) => a.type === 'spawn_enemies')).toBe(true);
      expect(goal.status).toBe(Goal.STATUS.COMPLETED);
    });

    it('SpiralAttackGoal should spawn enemies in spiral', () => {
      const goal = new SpiralAttackGoal(boss);
      goal.activate();

      boss.frameDelta = 0.2;
      // Execute enough times to spawn max enemies
      for (let i = 0; i < 20; i++) {
        goal.execute();
      }

      expect(boss.actions.some((a) => a.type === 'spawn_enemies')).toBe(true);
      expect(boss.actions.some((a) => a.type === 'shake')).toBe(true);
      expect(goal.status).toBe(Goal.STATUS.COMPLETED);
    });

    it('RepositionGoal should move boss and complete', () => {
      const goal = new RepositionGoal(boss);
      goal.activate();
      // biome-ignore lint/suspicious/noExplicitAny: access private property for testing
      expect((boss as any).arriveBehavior.active).toBe(true);

      goal.execute();
      expect(goal.status).toBe(Goal.STATUS.COMPLETED);
    });

    it('SummonGoal should spawn minions and complete', () => {
      const goal = new SummonGoal(boss);
      goal.activate();
      goal.execute();

      const spawnAction = boss.actions.find((a) => a.type === 'spawn_enemies');
      expect(spawnAction).toBeDefined();
      expect(spawnAction?.enemies?.some((e) => e.child)).toBe(true);
      expect(goal.status).toBe(Goal.STATUS.COMPLETED);
    });

    it('RageGoal should spawn many enemies and complete', () => {
      const goal = new RageGoal(boss);
      goal.activate();
      goal.execute();

      expect(boss.actions.some((a) => a.type === 'spawn_enemies')).toBe(true);
      expect(boss.actions.some((a) => a.type === 'shake')).toBe(true);
      expect(boss.actions.some((a) => a.type === 'flash')).toBe(true);
      expect(goal.status).toBe(Goal.STATUS.COMPLETED);
    });
  });
});
