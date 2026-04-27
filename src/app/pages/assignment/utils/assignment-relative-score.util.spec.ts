import { resolveRelativeScore } from './assignment-relative-score.util';

describe('resolveRelativeScore', () => {
  it('returns ratio-based score for normal positive values', () => {
    const result = resolveRelativeScore(80, 60);

    expect(result).toBe(75);
  });

  it('returns 0 when suggested baseline is zero or negative', () => {
    expect(resolveRelativeScore(0, 10)).toBe(0);
    expect(resolveRelativeScore(-10, 10)).toBe(0);
  });

  it('clamps candidate score above baseline to 100', () => {
    const result = resolveRelativeScore(50, 75);

    expect(result).toBe(100);
  });

  it('applies configured rounding precision', () => {
    const result = resolveRelativeScore(3, 2);

    expect(result).toBe(66.67);
  });
});

