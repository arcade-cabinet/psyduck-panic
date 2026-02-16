/**
 * Game Grading System
 *
 * Calculates post-game grade based on performance.
 * Restored from the original game's grading criteria.
 */

export interface GradeInfo {
  grade: string;
  className: string;
}

export function calculateGrade(win: boolean, accuracy: number, maxCombo: number): GradeInfo {
  if (win && accuracy > 0.9 && maxCombo > 8) return { grade: 'S', className: 'grade-s' };
  if (win && accuracy > 0.75) return { grade: 'A', className: 'grade-a' };
  if (win) return { grade: 'B', className: 'grade-b' };
  if (accuracy > 0.5) return { grade: 'C', className: 'grade-c' };
  return { grade: 'D', className: 'grade-d' };
}

export function calculateAccuracy(totalC: number, totalM: number): number {
  return Math.round((totalC / Math.max(1, totalC + totalM)) * 100);
}
