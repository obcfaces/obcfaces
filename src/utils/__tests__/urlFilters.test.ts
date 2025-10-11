import { describe, test, expect } from 'vitest';
import { 
  patchSearchParams, 
  getFilterParam,
  parseAgeRange,
  parseHeightRange,
  parseWeightRange
} from '../urlFilters';

describe('patchSearchParams', () => {
  test('adds new parameters', () => {
    const sp = new URLSearchParams('gender=female');
    const next = patchSearchParams(sp, { age: '18-25' });
    expect(next.get('gender')).toBe('female');
    expect(next.get('age')).toBe('18-25');
  });

  test('removes parameters with null/undefined/"all"/empty values', () => {
    const sp = new URLSearchParams('gender=female&age=18-25&view=compact');
    const next = patchSearchParams(sp, { 
      gender: 'all',
      age: '',
      view: null
    });
    expect(next.toString()).toBe('');
  });

  test('updates existing parameters', () => {
    const sp = new URLSearchParams('gender=female&age=18-25');
    const next = patchSearchParams(sp, { gender: 'male' });
    expect(next.get('gender')).toBe('male');
    expect(next.get('age')).toBe('18-25');
  });

  test('handles mixed operations', () => {
    const sp = new URLSearchParams('gender=female&view=compact');
    const next = patchSearchParams(sp, { 
      age: '26-35',
      gender: 'all',
      view: undefined
    });
    expect(next.toString()).toBe('age=26-35');
  });
});

describe('getFilterParam', () => {
  test('returns parameter value if exists', () => {
    const sp = new URLSearchParams('gender=female&age=18-25');
    expect(getFilterParam(sp, 'gender')).toBe('female');
  });

  test('returns default value if parameter missing', () => {
    const sp = new URLSearchParams('gender=female');
    expect(getFilterParam(sp, 'age', 'all')).toBe('all');
  });

  test('returns empty string as default when not specified', () => {
    const sp = new URLSearchParams();
    expect(getFilterParam(sp, 'gender')).toBe('');
  });
});

describe('parseAgeRange', () => {
  test('parses standard age ranges', () => {
    expect(parseAgeRange('18-25')).toEqual([18, 25]);
    expect(parseAgeRange('26-35')).toEqual([26, 35]);
    expect(parseAgeRange('36-45')).toEqual([36, 45]);
  });

  test('parses open-ended range', () => {
    expect(parseAgeRange('46+')).toEqual([46, 999]);
  });

  test('returns default range for invalid input', () => {
    expect(parseAgeRange('invalid')).toEqual([0, 999]);
    expect(parseAgeRange('')).toEqual([0, 999]);
  });
});

describe('parseHeightRange', () => {
  test('parses height range in cm', () => {
    expect(parseHeightRange('150-160 cm')).toEqual([150, 160]);
    expect(parseHeightRange('170-180')).toEqual([170, 180]);
  });

  test('returns default range for invalid input', () => {
    expect(parseHeightRange('invalid')).toEqual([0, 999]);
    expect(parseHeightRange('')).toEqual([0, 999]);
  });
});

describe('parseWeightRange', () => {
  test('parses weight range in kg', () => {
    expect(parseWeightRange('50-60 kg')).toEqual([50, 60]);
    expect(parseWeightRange('70-80')).toEqual([70, 80]);
  });

  test('parses weight range in lbs', () => {
    expect(parseWeightRange('110-130 lbs')).toEqual([110, 130]);
  });

  test('returns default range for invalid input', () => {
    expect(parseWeightRange('invalid')).toEqual([0, 999]);
    expect(parseWeightRange('')).toEqual([0, 999]);
  });
});
