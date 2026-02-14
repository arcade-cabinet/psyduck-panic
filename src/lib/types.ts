export interface EnemyType {
  words: string[];
  color: string;
  icon: string;
  counter: 'reality' | 'history' | 'logic';
}

export interface Wave {
  name: string;
  sub: string;
  dur: number;
  spawn: number;
  max: number;
  spd: number;
  boss?: BossConfig;
}

export interface BossConfig {
  name: string;
  hp: number;
  pats: string[];
}

export interface PowerUp {
  id: string;
  icon: string;
  color: string;
  name: string;
  dur: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  word: string;
  type: EnemyType;
  vx: number;
  vy: number;
  counter: string;
  encrypted?: boolean;
  spd: number;
  child?: boolean;
  iFrame?: number;
}

export interface Boss {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  pat: string;
  timer: number;
  name: string;
  iFrame: number;
  xVel?: number;
  spiralAngle?: number;
}

export interface GameState {
  panic: number;
  combo: number;
  score: number;
  wave: number;
  time: number;
  running: boolean;
  endless: boolean;
  currentWave?: Wave;
  enemies: Enemy[];
  boss?: Boss;
}
