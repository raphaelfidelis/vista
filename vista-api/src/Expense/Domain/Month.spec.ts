import { ExpenseValidationError } from './Errors/ExpenseValidation.error';
import { Month } from './Month';

describe('Month', () => {
  it('lê o formato AAAA-MM', () => {
    expect(Month.parse('2026-09').toString()).toBe('2026-09');
  });

  it.each([
    '2026-13',
    '2026-00',
    '2026-9',
    '26-09',
    '2026/09',
    '1899-12',
    '',
    undefined,
    202609,
  ])('recusa %p', (value) => {
    expect(() => Month.parse(value)).toThrow(ExpenseValidationError);
  });

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
});
