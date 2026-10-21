import { FinanceValidationError } from './Errors/FinanceValidation.error';
import { Month } from './Month';

describe('Month', () => {
  it('lê o formato AAAA-MM', () => {
    expect(Month.parse('2026-09').toString()).toBe('2026-09');
  });

  it.each(['2026-13', '2026-00', '2026-9', '26-09', '2026/09', '1899-12', ''])(
    'recusa %p',
    (value) => {
      expect(() => Month.parse(value)).toThrow(FinanceValidationError);
    },
  );

  it('volta para dezembro do ano anterior a partir de janeiro', () => {
    expect(Month.parse('2026-01').previous().toString()).toBe('2025-12');
    expect(Month.parse('2026-09').previous().toString()).toBe('2026-08');
  });

  it.each([
    ['2024-02', '2024-02-29'],
    ['2026-02', '2026-02-28'],
    ['2026-04', '2026-04-30'],
    ['2026-12', '2026-12-31'],
  ])('%s termina em %s', (month, lastDay) => {
    expect(Month.parse(month).lastDay()).toBe(lastDay);
  });

  it('começa no dia 1', () => {
    expect(Month.parse('2026-09').firstDay()).toBe('2026-09-01');
  });

  describe('plus', () => {
    it.each([
      ['2026-10', 1, '2026-11'],
      ['2026-12', 1, '2027-01'],
      ['2026-01', -1, '2025-12'],
      ['2026-10', 14, '2027-12'],
      ['2026-10', 0, '2026-10'],
    ])('%s mais %p meses é %s', (month, delta, expected) => {
      expect(Month.parse(month).plus(delta).toString()).toBe(expected);
    });
  });

  describe('monthsUntil', () => {
    it('conta os meses até outro, virando o ano', () => {
      expect(Month.parse('2026-10').monthsUntil(Month.parse('2027-02'))).toBe(
        4,
      );
      expect(Month.parse('2026-10').monthsUntil(Month.parse('2026-10'))).toBe(
        0,
      );
    });

    it('fica negativo quando o outro vem antes', () => {
      expect(Month.parse('2026-01').monthsUntil(Month.parse('2025-12'))).toBe(
        -1,
      );
    });
  });

  describe('dateOn', () => {
    it.each([
      ['2026-10', 5, '2026-10-05'],
      ['2026-02', 31, '2026-02-28'],
      ['2028-02', 31, '2028-02-29'],
      ['2026-04', 31, '2026-04-30'],
    ])('%s dia %p é %s', (month, day, expected) => {
      expect(Month.parse(month).dateOn(day)).toBe(expected);
    });
  });
});
