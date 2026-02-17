import { describe, expect, it } from 'vitest';
import { GameLogic } from './game-logic';
import type { BossAction } from './ai/boss-ai';

describe('GameLogic - Boss Actions', () => {
  it('should execute boss actions from AI', () => {
    const game = new GameLogic();
    // Setup game with boss
    game.startWave(0); // wave 0
    game.startBoss({ name: 'TEST', hp: 100, pats: ['burst'] });

    // Mock bossAI actions
    const mockActions: BossAction[] = [
      { type: 'move', x: 200, y: 150 },
      { type: 'flash', intensity: 0.8 },
      { type: 'shake', intensity: 10 },
      {
        type: 'spawn_enemies',
        enemies: [{ x: 100, y: 100 }]
      }
    ];

    // Access private method to test it with a typed cast instead of `any`
    (game as unknown as { executeBossActions: (actions: BossAction[]) => void }).executeBossActions(mockActions);

    expect(game.boss?.x).toBe(200);
    expect(game.boss?.y).toBe(150);
    expect(game.fl).toBe(0.8);
    expect(game.shake).toBe(10);
    expect(game.enemies.length).toBe(1);
    expect(game.enemies[0].x).toBe(100);
    expect(game.enemies[0].y).toBe(100);
  });

  it('should get complete game state', () => {
    const game = new GameLogic();
    game.start();
    const state = game.getState();
    expect(state.score).toBe(0);
    expect(state.running).toBe(true);
    expect(state.enemies).toBeDefined();
    expect(state.events).toBeDefined();
  });

  it('should add feed item when timer threshold reached', () => {
    const game = new GameLogic();
    game.start();
    game.feedTimer = 3001; // Over threshold
    game.update(16, Date.now()); // Trigger update check with non-zero dt

    // Check if FEED event was added
    const feedEvent = game.events.find(e => e.type === 'FEED');
    expect(feedEvent).toBeDefined();
    expect(game.feedTimer).toBe(0);
  });
});
