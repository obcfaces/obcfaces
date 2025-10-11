import { describe, test, expect } from 'vitest';
import { normalizeLocale, parseLocaleTuple } from '../useLocale';

describe('normalizeLocale', () => {
  test('returns lowercase normalized locale for valid input', () => {
    expect(normalizeLocale('en-ph')).toBe('en-ph');
    expect(normalizeLocale('ru-kz')).toBe('ru-kz');
  });

  test('normalizes uppercase to lowercase', () => {
    expect(normalizeLocale('EN-PH')).toBe('en-ph');
    expect(normalizeLocale('RU-KZ')).toBe('ru-kz');
    expect(normalizeLocale('En-Ph')).toBe('en-ph');
  });

  test('returns default for invalid locale', () => {
    expect(normalizeLocale('xx-zz')).toBe('en-ph');
    expect(normalizeLocale('invalid')).toBe('en-ph');
  });

  test('returns default for undefined/null', () => {
    expect(normalizeLocale(undefined)).toBe('en-ph');
    expect(normalizeLocale('')).toBe('en-ph');
  });

  test('validates and normalizes malformed input', () => {
    expect(normalizeLocale('en-ph-extra')).toBe('en-ph');
  });
});

describe('parseLocaleTuple', () => {
  test('parses valid locale into lang and cc', () => {
    expect(parseLocaleTuple('en-ph')).toEqual({ lang: 'en', cc: 'ph' });
    expect(parseLocaleTuple('ru-kz')).toEqual({ lang: 'ru', cc: 'kz' });
  });

  test('normalizes before parsing', () => {
    expect(parseLocaleTuple('EN-PH')).toEqual({ lang: 'en', cc: 'ph' });
  });

  test('returns default tuple for invalid input', () => {
    expect(parseLocaleTuple('invalid')).toEqual({ lang: 'en', cc: 'ph' });
    expect(parseLocaleTuple('xx-zz')).toEqual({ lang: 'en', cc: 'ph' });
  });
});
