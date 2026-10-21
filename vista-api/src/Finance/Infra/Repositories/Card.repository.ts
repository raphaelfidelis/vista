import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../../Domain/Card';
import { CardRepository } from '../../Domain/Repositories/Card.repository';
import { CardMapper } from '../Mappers/Card.mapper';
import { CardModel } from '../Models/Card.model';

@Injectable()
export class TypeOrmCardRepository implements CardRepository {
  constructor(
    @InjectRepository(CardModel)
    private readonly repository: Repository<CardModel>,
  ) {}

  async findAll(userId: string): Promise<Card[]> {
    const models = await this.repository.find({
      where: { userId },
      order: { name: 'ASC' },
    });

    return CardMapper.arrayToDomain(models);
  }

  async findById(userId: string, id: string): Promise<Card | null> {
    const model = await this.repository.findOneBy({ userId, id });

    return model ? CardMapper.toDomain(model) : null;
  }

  async findByName(userId: string, name: string): Promise<Card | null> {
    // Igualdade com LOWER, e não ILIKE: no ILIKE, "%" e "_" no nome virariam curinga.
    const model = await this.repository
      .createQueryBuilder('card')
      .where('card.userId = :userId AND LOWER(card.name) = LOWER(:name)', {
        userId,
        name,
      })
      .getOne();

    return model ? CardMapper.toDomain(model) : null;
  }

  existsWithBank(userId: string, bankId: string): Promise<boolean> {
    return this.repository.existsBy({ userId, bankId });
  }

  async save(card: Card): Promise<void> {
    await this.repository.save(CardMapper.toModel(card));
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.repository.delete({ userId, id });
  }
}
