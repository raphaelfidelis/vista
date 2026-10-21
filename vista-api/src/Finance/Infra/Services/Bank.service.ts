import { Inject, Injectable } from '@nestjs/common';
import { Bank } from '../../Domain/Bank';
import { FinanceDuplicateError } from '../../Domain/Errors/FinanceDuplicate.error';
import { FinanceInUseError } from '../../Domain/Errors/FinanceInUse.error';
import { FinanceNotFoundError } from '../../Domain/Errors/FinanceNotFound.error';
import { BankDto } from '../../Domain/Queries/FindBanks.query';
import type { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { ACCOUNT_REPOSITORY } from '../../Domain/Repositories/Account.repository';
import type { BankRepository } from '../../Domain/Repositories/Bank.repository';
import { BANK_REPOSITORY } from '../../Domain/Repositories/Bank.repository';
import type { CardRepository } from '../../Domain/Repositories/Card.repository';
import { CARD_REPOSITORY } from '../../Domain/Repositories/Card.repository';
import { BankInput, BankService } from '../../Domain/Services/Bank.service';
import { BankMapper } from '../Mappers/Bank.mapper';

@Injectable()
export class BankServiceImpl implements BankService {
  constructor(
    @Inject(BANK_REPOSITORY)
    private readonly banks: BankRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cards: CardRepository,
  ) {}

  async create(userId: string, { name }: BankInput): Promise<BankDto> {
    const bank = Bank.create(userId, name);
    await this.ensureNameIsFree(userId, bank);
    await this.banks.save(bank);

    return BankMapper.toDto(bank);
  }

  async rename(
    userId: string,
    id: string,
    { name }: BankInput,
  ): Promise<BankDto> {
    const bank = await this.find(userId, id);
    bank.name = name;
    await this.ensureNameIsFree(userId, bank);
    await this.banks.save(bank);

    return BankMapper.toDto(bank);
  }

  async remove(userId: string, id: string): Promise<void> {
    const bank = await this.find(userId, id);

    if (
      (await this.accounts.existsWithBank(userId, id)) ||
      (await this.cards.existsWithBank(userId, id))
    ) {
      throw new FinanceInUseError(
        'O banco "' +
          bank.name +
          '" tem contas ou cartões e não pode ser removido',
      );
    }

    await this.banks.delete(userId, id);
  }

  private async find(userId: string, id: string): Promise<Bank> {
    const bank = await this.banks.findById(userId, id);

    if (!bank) {
      throw new FinanceNotFoundError('Banco não encontrado: ' + id);
    }

    return bank;
  }

  /** O próprio banco pode manter o nome (ou mudar só maiúsculas); outro não. */
  private async ensureNameIsFree(userId: string, bank: Bank): Promise<void> {
    const existing = await this.banks.findByName(userId, bank.name);

    // O nome do existente, não o digitado: tentando "nubank", o útil é saber
    // que "Nubank" já existe.
    if (existing && existing.id !== bank.id) {
      throw new FinanceDuplicateError(
        'Já existe um banco chamado "' + existing.name + '"',
      );
    }
  }
}
