import { Inject, Injectable } from '@nestjs/common';
import { BankDto, FindBanksQuery } from '../../Domain/Queries/FindBanks.query';
import type { BankRepository } from '../../Domain/Repositories/Bank.repository';
import { BANK_REPOSITORY } from '../../Domain/Repositories/Bank.repository';
import { BankMapper } from '../Mappers/Bank.mapper';

@Injectable()
export class FindBanksHandler implements FindBanksQuery {
  constructor(
    @Inject(BANK_REPOSITORY)
    private readonly banks: BankRepository,
  ) {}

  async execute(userId: string): Promise<BankDto[]> {
    const banks = await this.banks.findAll(userId);

    return banks.map((bank) => BankMapper.toDto(bank));
  }
}
