import { Session } from '../../Domain/Session';
import { SessionModel } from '../Models/Session.model';

export class SessionMapper {
  static toDomain(model: SessionModel): Session {
    return new Session(
      model.id,
      model.userId,
      model.tokenHash,
      model.expiresAt,
      model.lastUsedAt,
      model.createdAt,
    );
  }

  static toModel(session: Session): SessionModel {
    const model = new SessionModel();
    model.id = session.id;
    model.userId = session.userId;
    model.tokenHash = session.tokenHash;
    model.expiresAt = session.expiresAt;
    model.lastUsedAt = session.lastUsedAt;
    model.createdAt = session.createdAt;

    return model;
  }
}
