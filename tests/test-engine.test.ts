import { describe, it, expect } from 'vitest';
import { shuffle } from '../src/lib/shuffle';

describe('shuffle', () => {
  it('returns array of same length', () => {
    const a = [1, 2, 3, 4, 5];
    const s = shuffle(a);
    expect(s).toHaveLength(a.length);
    expect(s.sort()).toEqual(a.sort());
  });

  it('does not mutate input', () => {
    const a = [1, 2, 3];
    const before = [...a];
    shuffle(a);
    expect(a).toEqual(before);
  });
});
