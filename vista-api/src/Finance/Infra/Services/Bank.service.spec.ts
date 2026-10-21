import { Bank } from '../../Domain/Bank';
import { FinanceDuplicateError } from '../../Domain/Errors/FinanceDuplicate.error';
import { FinanceInUseError } from '../../Domain/Errors/FinanceInUse.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../../Domain/Errors/FinanceValidation.error';
import { Account } from '../../Domain/Account';
import { Card } from '../../Domain/Card';
import { BankServiceImpl } from './Bank.service';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '99999999-9999-4999-8999-999999999999';

function setup() {
  const banks = {
    findAll: jest.fn<Promise<Bank[]>, [string]>(),
    findById: jest.fn<Promise<Bank | null>, [string, string]>(),
    findByName: jest.fn<Promise<Bank | null>, [string, string]>(),
    save: jest.fn<Promise<void>, [Bank]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };
  const accounts = {
    findAll: jest.fn<Promise<Account[]>, [string]>(),
    findById: jest.fn<Promise<Account | null>, [string, string]>(),
    findByName: jest.fn<Promise<Account | null>, [string, string]>(),
    existsWithBank: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Account]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };

  const cards = {
    findAll: jest.fn<Promise<Card[]>, [string]>(),
    findById: jest.fn<Promise<Card | null>, [string, string]>(),
    findByName: jest.fn<Promise<Card | null>, [string, string]>(),
    existsWithBank: jest.fn<Promise<boolean>, [string, string]>(),
    save: jest.fn<Promise<void>, [Card]>(),
    delete: jest.fn<Promise<void>, [string, string]>(),
  };

  banks.findByName.mockResolvedValue(null);
  accounts.existsWithBank.mockResolvedValue(false);
  cards.existsWithBank.mockResolvedValue(false);

  return {
    banks,
    accounts,
    cards,
    service: new BankServiceImpl(banks, accounts, cards),
  };
}

describe('BankServiceImpl', () => {
  describe('create', () => {
    it('salva e devolve o banco', async () => {
      const { banks, service } = setup();

      const created = await service.create(USER, { name: ' Nubank ' });

      expect(created.name).toBe('Nubank');
      expect(banks.save).toHaveBeenCalledTimes(1);
    });

    it('recusa nome já usado, citando o nome que existe', async () => {
      const { banks, service } = setup();
      banks.findByName.mockResolvedValue(Bank.create(USER, 'Nubank'));

      await expect(service.create(USER, { name: 'nubank' })).rejects.toThrow(
        'Já existe um banco chamado "Nubank"',
      );
      await expect(
        service.create(USER, { name: 'nubank' }),
      ).rejects.toBeInstanceOf(FinanceDuplicateError);
      expect(banks.save).not.toHaveBeenCalled();
    });

    it('recusa nome vazio', async () => {
      const { service } = setup();

      await expect(service.create(USER, { name: '  ' })).rejects.toBeInstanceOf(
        FinanceValidationError,
      );
    });
  });

  describe('rename', () => {
    it('permite manter o nome, mudando só as maiúsculas', async () => {
      const { banks, service } = setup();
      const nubank = Bank.create(USER, 'Nubank');
      banks.findById.mockResolvedValue(nubank);
      banks.findByName.mockResolvedValue(nubank);

      const renamed = await service.rename(USER, nubank.id, { name: 'NUBANK' });

      expect(renamed.name).toBe('NUBANK');
    });

    it('recusa o nome de outro banco', async () => {
      const { banks, service } = setup();
      const nubank = Bank.create(USER, 'Nubank');
      banks.findById.mockResolvedValue(nubank);
      banks.findByName.mockResolvedValue(Bank.create(USER, 'Inter'));

      await expect(
        service.rename(USER, nubank.id, { name: 'inter' }),
      ).rejects.toBeInstanceOf(FinanceDuplicateError);
      expect(banks.save).not.toHaveBeenCalled();
    });

    it('falha quando o banco não existe', async () => {
      const { banks, service } = setup();
      banks.findById.mockResolvedValue(null);

      await expect(
        service.rename(USER, '11111111-1111-4111-8111-111111111111', {
          name: 'X',
        }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });
  });

  describe('remove', () => {
    it('remove banco sem contas', async () => {
      const { banks, accounts, service } = setup();
      const nubank = Bank.create(USER, 'Nubank');
      banks.findById.mockResolvedValue(nubank);
      accounts.existsWithBank.mockResolvedValue(false);

      await service.remove(USER, nubank.id);

      expect(banks.delete).toHaveBeenCalledWith(USER, nubank.id);
    });

    it('recusa remover banco com cartões', async () => {
      const { banks, cards, service } = setup();
      const nubank = Bank.create(USER, 'Nubank');
      banks.findById.mockResolvedValue(nubank);
      cards.existsWithBank.mockResolvedValue(true);

      await expect(service.remove(USER, nubank.id)).rejects.toThrow(
        'tem contas ou cartões',
      );
      expect(banks.delete).not.toHaveBeenCalled();
    });

    it('recusa remover banco com contas', async () => {
      const { banks, accounts, service } = setup();
      const nubank = Bank.create(USER, 'Nubank');
      banks.findById.mockResolvedValue(nubank);
      accounts.existsWithBank.mockResolvedValue(true);

      await expect(service.remove(USER, nubank.id)).rejects.toBeInstanceOf(
        FinanceInUseError,
      );
      expect(banks.delete).not.toHaveBeenCalled();
    });

    it('falha quando o banco não existe', async () => {
      const { banks, service } = setup();
      banks.findById.mockResolvedValue(null);

      await expect(
        service.remove(USER, '11111111-1111-4111-8111-111111111111'),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
    });
  });

  describe('isolamento por usuário', () => {
    it('o banco nasce do dono da sessão, mesmo que o corpo diga outro', async () => {
      const { banks, service } = setup();

      await service.create(OTHER, { name: 'Nubank', userId: USER } as never);

      expect(banks.save.mock.calls[0]?.[0].userId).toBe(OTHER);
      expect(banks.findByName).toHaveBeenCalledWith(OTHER, 'Nubank');
    });

    it('o banco de outro usuário não existe: não renomeia nem remove', async () => {
      const { banks, service } = setup();
      const known = [Bank.create(USER, 'Nubank')];
      banks.findById.mockImplementation((userId: string, id: string) =>
        Promise.resolve(
          userId === USER ? (known.find((x) => x.id === id) ?? null) : null,
        ),
      );

      await expect(
        service.rename(OTHER, known[0].id, { name: 'Hackeado' }),
      ).rejects.toBeInstanceOf(FinanceNotFoundError);
      await expect(service.remove(OTHER, known[0].id)).rejects.toBeInstanceOf(
        FinanceNotFoundError,
      );
      expect(banks.save).not.toHaveBeenCalled();
      expect(banks.delete).not.toHaveBeenCalled();
      await expect(
        service.rename(USER, known[0].id, { name: 'Novo' }),
      ).resolves.toMatchObject({ name: 'Novo' });
    });
  });
});
