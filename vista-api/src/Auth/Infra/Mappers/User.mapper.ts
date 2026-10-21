import { UserDto } from '../../Domain/Queries/GetCurrentUser.query';
import { User } from '../../Domain/User';
import { UserModel } from '../Models/User.model';

export class UserMapper {
  static toDomain(model: UserModel): User {
    return new User(
      model.id,
      model.name,
      model.email,
      model.passwordHash,
      model.createdAt,
    );
  }

  static toModel(user: User): UserModel {
    const model = new UserModel();
    model.id = user.id;
    model.name = user.name;
    model.email = user.email;
    model.passwordHash = user.passwordHash;
    model.createdAt = user.createdAt;

    return model;
  }

  static toDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      hasPassword: user.hasPassword,
    };
  }
}
