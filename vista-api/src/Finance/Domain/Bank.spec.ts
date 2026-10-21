import { Bank } from './Bank';
import { FinanceValidationError } from './Errors/FinanceValidation.error';

const USER = '11111111-1111-4111-8111-111111111111';

describe('Bank', () => {
  it('nasce com id próprio e nome aparado', () => {
    const bank = Bank.create(USER, ' Nubank ');

    expect(bank.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(bank.name).toBe('Nubank');
  });

  it('recusa nome vazio', () => {
    expect(() => Bank.create(USER, '  ')).toThrow(FinanceValidationError);
  });
});
