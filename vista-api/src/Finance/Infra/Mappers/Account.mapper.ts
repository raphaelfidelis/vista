import { Account } from '../../Domain/Account';
import { AccountDto } from '../../Domain/Queries/FindAccounts.query';
import { AccountModel } from '../Models/Account.model';

export class AccountMapper {
  static toDomain(model: AccountModel): Account {
    return new Account(
      model.id,
      model.userId,
      model.name,
      model.type,
      model.bankId,
      model.initialBalanceInCents,
      model.initialBalanceDate,
      model.archived,
      model.createdAt,
    );
  }

  static arrayToDomain(models: AccountModel[]): Account[] {
    return models.map((model) => AccountMapper.toDomain(model));
  }

  static toModel(account: Account): AccountModel {
    const model = new AccountModel();
    model.id = account.id;
    model.userId = account.userId;
    model.name = account.name;
    model.type = account.type;
    model.bankId = account.bankId;
    model.initialBalanceInCents = account.initialBalanceInCents;
    model.initialBalanceDate = account.initialBalanceDate;
    model.archived = account.archived;
    model.createdAt = account.createdAt;

    return model;
  }

  /** O nome do banco e o saldo vêm de fora: a conta só conhece o id do banco e não guarda o saldo. */
  static toDto(
    account: Account,
    bankName: string | null,
    balanceInCents: number,
  ): AccountDto {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      bankId: account.bankId,
      bankName,
      initialBalanceInCents: account.initialBalanceInCents,
      initialBalanceDate: account.initialBalanceDate,
      archived: account.archived,
      balanceInCents,
      createdAt: account.createdAt.toISOString(),
    };
  }
}
