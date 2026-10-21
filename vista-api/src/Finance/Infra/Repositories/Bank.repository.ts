import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bank } from '../../Domain/Bank';
import { BankRepository } from '../../Domain/Repositories/Bank.repository';
import { BankMapper } from '../Mappers/Bank.mapper';
import { BankModel } from '../Models/Bank.model';

@Injectable()
export class TypeOrmBankRepository implements BankRepository {
  constructor(
    @InjectRepository(BankModel)
    private readonly repository: Repository<BankModel>,
  ) {}

  async findAll(userId: string): Promise<Bank[]> {
    const models = await this.repository.find({
      where: { userId },
      order: { name: 'ASC' },
    });

    return BankMapper.arrayToDomain(models);
  }

  async findById(userId: string, id: string): Promise<Bank | null> {
    const model = await this.repository.findOneBy({ userId, id });

    return model ? BankMapper.toDomain(model) : null;
  }

  async findByName(userId: string, name: string): Promise<Bank | null> {
    // Igualdade com LOWER, e não ILIKE: no ILIKE, "%" e "_" no nome virariam curinga.
    const model = await this.repository
      .createQueryBuilder('bank')
      .where('bank.userId = :userId AND LOWER(bank.name) = LOWER(:name)', {
        userId,
        name,
      })
      .getOne();

    return model ? BankMapper.toDomain(model) : null;
  }

  async save(bank: Bank): Promise<void> {
    await this.repository.save(BankMapper.toModel(bank));
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.repository.delete({ userId, id });
  }
}
