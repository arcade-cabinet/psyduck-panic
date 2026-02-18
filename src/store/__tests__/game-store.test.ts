import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../game-store';

describe('game-store', () => {
  beforeEach(() => {
    useGameStore.setState({ phase: 'title' });
  });

  it('initial phase is title', () => {
    expect(useGameStore.getState().phase).toBe('title');
  });

  it('setPhase changes phase', () => {
    useGameStore.getState().setPhase('playing');
    expect(useGameStore.getState().phase).toBe('playing');
  });

  it('togglePause from playing goes to paused', () => {
    useGameStore.getState().setPhase('playing');
    useGameStore.getState().togglePause();
    expect(useGameStore.getState().phase).toBe('paused');
  });

  it('togglePause from paused goes to playing', () => {
    useGameStore.getState().setPhase('paused');
    useGameStore.getState().togglePause();
    expect(useGameStore.getState().phase).toBe('playing');
  });

  it('togglePause from title does nothing', () => {
    useGameStore.getState().togglePause();
    expect(useGameStore.getState().phase).toBe('title');
  });

  it('togglePause from gameover does nothing', () => {
    useGameStore.getState().setPhase('gameover');
    useGameStore.getState().togglePause();
    expect(useGameStore.getState().phase).toBe('gameover');
  });

  it('restart sets phase to title', () => {
    useGameStore.getState().setPhase('playing');
    useGameStore.getState().restart();
    expect(useGameStore.getState().phase).toBe('title');
  });
});
