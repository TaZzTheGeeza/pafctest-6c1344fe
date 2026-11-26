import { describe, expect, it } from 'vitest';
import { SHUTTLES, STEPS, DEADLINES, completedAt, score, targetAt } from './bleepTest';
describe('weekly 20m bleep test scoring', () => {
  it('starts at 8.5 km/h over 20m with seven shuttles', () => {
    expect(STEPS[0]?.seconds).toBeCloseTo(20 / (8.5 / 3.6), 8);
    expect(SHUTTLES[0]).toBe(7);
  });
  it('increases pace by 0.5 km/h at level two', () => { expect(STEPS[7]?.seconds).toBe(8); });
  it('records the last completed shuttle rather than the unfinished one', () => {
    const first = DEADLINES[0] ?? 0;
    expect(completedAt(first - 0.1)).toBe(0);
    expect(completedAt(first)).toBe(1);
    expect(score(completedAt(first))).toBe('1.1');
  });
  it('scores the level transition without treating score as a decimal', () => {
    expect(score(7)).toBe('1.7'); expect(score(8)).toBe('2.1'); expect(targetAt(DEADLINES[6] ?? 0)?.level).toBe(2);
  });
  it('has 247 shuttles and retains a valid final score', () => {
    expect(STEPS).toHaveLength(247); expect(score(247)).toBe('21.16');
    expect(completedAt((DEADLINES.at(-1) ?? 0) + 1)).toBe(247);
  });
  it('awards nothing during the five-second countdown', () => { expect(completedAt(5)).toBe(0); expect(score(0)).toBe('0.0'); });
});
