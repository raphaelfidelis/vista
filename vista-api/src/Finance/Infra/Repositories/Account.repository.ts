import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../../Domain/Account';
import { AccountRepository } from '../../Domain/Repositories/Account.repository';
import { AccountMapper } from '../Mappers/Account.mapper';
import { AccountModel } from '../Models/Account.model';

@Injectable()
export class TypeOrmAccountRepository implements AccountRepository {
  constructor(
    @InjectRepository(AccountModel)
    private readonly repository: Repository<AccountModel>,
  ) {}

  async findAll(userId: string): Promise<Account[]> {
    const models = await this.repository.find({
      where: { userId },
      order: { name: 'ASC' },
    });

    return AccountMapper.arrayToDomain(models);
  }

  async findById(userId: string, id: string): Promise<Account | null> {
    const model = await this.repository.findOneBy({ userId, id });

    return model ? AccountMapper.toDomain(model) : null;
  }

  async findByName(userId: string, name: string): Promise<Account | null> {
    // Igualdade com LOWER, e não ILIKE: no ILIKE, "%" e "_" no nome virariam curinga.
    const model = await this.repository
      .createQueryBuilder('account')
      .where(
        'account.userId = :userId AND LOWER(account.name) = LOWER(:name)',
        { userId, name },
      )
      .getOne();

    return model ? AccountMapper.toDomain(model) : null;
  }

  existsWithBank(userId: string, bankId: string): Promise<boolean> {
    return this.repository.existsBy({ userId, bankId });
  }

  async save(account: Account): Promise<void> {
    await this.repository.save(AccountMapper.toModel(account));
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.repository.delete({ userId, id });
  }
}
