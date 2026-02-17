import type { MainMessage, WorkerMessage } from '../lib/events';
import { GameLogic } from '../lib/game-logic';

let logic: GameLogic | undefined;
let running = false;
let lastTime = 0;
let timerId: ReturnType<typeof setTimeout> | undefined;

// Attempt to initialize logic immediately to catch load errors
try {
  logic = new GameLogic();
  // Signal ready state if needed, but for now just log
  // console.log('[game.worker] GameLogic initialized');
} catch (err) {
  console.error('[game.worker] Failed to initialize GameLogic:', err);
  self.postMessage({
    type: 'ERROR',
    message: `Worker Init Error: ${err instanceof Error ? err.message : String(err)}`,
  });
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  try {
    const msg = e.data;

    // Lazy init check
    if (!logic && msg.type === 'START') {
      try {
        logic = new GameLogic();
      } catch (err) {
        throw new Error(`Lazy init failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (!logic) {
      if (msg.type !== 'TERMINATE') {
         console.warn('[game.worker] Logic not initialized, ignoring message:', msg.type);
      }
      if (msg.type === 'TERMINATE') {
        self.close();
      }
      return;
    }

    switch (msg.type) {
      case 'START':
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        running = true;
        if (msg.endless) {
          logic.startEndlessMode();
        } else {
          logic.start(msg.seed);
        }
        lastTime = performance.now();
        scheduleLoop();
        break;
      case 'PAUSE':
        running = false;
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        break;
      case 'RESUME':
        if (!running) {
          running = true;
          lastTime = performance.now();
          scheduleLoop();
        }
        break;
      case 'INPUT':
        if (msg.key === '1') logic.triggerAbility('reality');
        else if (msg.key === '2') logic.triggerAbility('history');
        else if (msg.key === '3') logic.triggerAbility('logic');
        else if (msg.key === 'q' || msg.key === 'Q') logic.triggerNuke();
        break;
      case 'ABILITY':
        logic.triggerAbility(msg.ability);
        break;
      case 'NUKE':
        logic.triggerNuke();
        break;
      case 'CLICK': {
        const enemy = logic.findEnemyAt(msg.x, msg.y);
        if (enemy && !enemy.encrypted) {
          logic.triggerAbility(enemy.type.counter);
        }
        break;
      }
      case 'TERMINATE':
        running = false;
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        self.close();
        return;
    }
  } catch (err) {
    running = false;
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    console.error('[game.worker] Unhandled error in message handler:', err);
    const errorMsg: MainMessage = {
      type: 'ERROR',
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(errorMsg);
  }
};

function scheduleLoop() {
  timerId = setTimeout(() => {
    try {
      loop(performance.now());
    } catch (err) {
       console.error('[game.worker] Loop error:', err);
       running = false;
       self.postMessage({
         type: 'ERROR',
         message: `Loop Error: ${err instanceof Error ? err.message : String(err)}`,
       });
    }
  }, 16);
}

function loop(now: number) {
  if (!running || !logic) return;

  // Relax dt clamp to 60 (approx 1000ms) to allow catchup in slow CI environments
  // where requestAnimationFrame (or even setTimeout) might be throttled to 1Hz.
  const dt = Math.min((now - lastTime) / 16.67, 60);
  lastTime = now;

  logic.update(dt, now);
  const state = logic.getState();

  const msg: MainMessage = { type: 'STATE', state };
  self.postMessage(msg);

  if (logic.running) {
    scheduleLoop();
  } else {
    running = false;
  }
}
