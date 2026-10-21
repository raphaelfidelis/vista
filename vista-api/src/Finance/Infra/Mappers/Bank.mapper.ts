import { Bank } from '../../Domain/Bank';
import { BankDto } from '../../Domain/Queries/FindBanks.query';
import { BankModel } from '../Models/Bank.model';

export class BankMapper {
  static toDomain(model: BankModel): Bank {
    return new Bank(model.id, model.userId, model.name, model.createdAt);
  }

  static arrayToDomain(models: BankModel[]): Bank[] {
    return models.map((model) => BankMapper.toDomain(model));
  }

  static toModel(bank: Bank): BankModel {
    const model = new BankModel();
    model.id = bank.id;
    model.userId = bank.userId;
    model.name = bank.name;
    model.createdAt = bank.createdAt;

    return model;
  }

  static toDto(bank: Bank): BankDto {
    return {
      id: bank.id,
      name: bank.name,
      createdAt: bank.createdAt.toISOString(),
    };
  }
}
