import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { SessionRepository } from '../../Domain/Repositories/Session.repository';
import { Session, SESSION_INACTIVITY_MS } from '../../Domain/Session';
import { SessionMapper } from '../Mappers/Session.mapper';
import { SessionModel } from '../Models/Session.model';

@Injectable()
export class TypeOrmSessionRepository implements SessionRepository {
  constructor(
    @InjectRepository(SessionModel)
    private readonly repository: Repository<SessionModel>,
  ) {}

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const model = await this.repository.findOneBy({ tokenHash });

    return model ? SessionMapper.toDomain(model) : null;
  }

  async save(session: Session): Promise<void> {
    await this.repository.save(SessionMapper.toModel(session));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async deleteOthers(userId: string, keepId: string): Promise<void> {
    await this.repository.delete({ userId, id: Not(keepId) });
  }

  async deleteByUser(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }

  async deleteExpired(now: Date): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .where('"expiresAt" <= :now', { now })
      .orWhere('"lastUsedAt" <= :idleSince', {
        idleSince: new Date(now.getTime() - SESSION_INACTIVITY_MS),
      })
      .execute();
  }
}
