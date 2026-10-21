import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { AuthEmailTakenError } from '../../Domain/Errors/AuthEmailTaken.error';
import { UserRepository } from '../../Domain/Repositories/User.repository';
import { User } from '../../Domain/User';
import { UserMapper } from '../Mappers/User.mapper';
import { UserModel } from '../Models/User.model';

/** Código do Postgres para violação de índice único. */
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserModel)
    private readonly repository: Repository<UserModel>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const model = await this.repository.findOneBy({ id });

    return model ? UserMapper.toDomain(model) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const model = await this.repository.findOneBy({ email });

    return model ? UserMapper.toDomain(model) : null;
  }

  async save(user: User): Promise<void> {
    try {
      await this.repository.save(UserMapper.toModel(user));
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === UNIQUE_VIOLATION
      ) {
        throw new AuthEmailTakenError();
      }

      throw error;
    }
  }
}
