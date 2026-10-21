import { Inject, Injectable } from '@nestjs/common';
import { AuthUnauthenticatedError } from '../../Domain/Errors/AuthUnauthenticated.error';
import {
  GetCurrentUserQuery,
  UserDto,
} from '../../Domain/Queries/GetCurrentUser.query';
import type { UserRepository } from '../../Domain/Repositories/User.repository';
import { USER_REPOSITORY } from '../../Domain/Repositories/User.repository';
import { UserMapper } from '../Mappers/User.mapper';

@Injectable()
export class GetCurrentUserHandler implements GetCurrentUserQuery {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(userId: string): Promise<UserDto> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new AuthUnauthenticatedError();
    }

    return UserMapper.toDto(user);
  }
}
