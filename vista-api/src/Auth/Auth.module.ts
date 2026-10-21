import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceModule } from '../Finance/Finance.module';
import { AuthController } from './Controllers/Auth.controller';
import { AuthGuard } from './Controllers/Auth.guard';
import { GET_CURRENT_USER_QUERY } from './Domain/Queries/GetCurrentUser.query';
import { SESSION_REPOSITORY } from './Domain/Repositories/Session.repository';
import { USER_REPOSITORY } from './Domain/Repositories/User.repository';
import { AUTH_SERVICE } from './Domain/Services/Auth.service';
import { AUTH_CLOCK } from './Domain/Services/AuthClock';
import { PASSWORD_HASHER } from './Domain/Services/PasswordHasher';
import { SessionModel } from './Infra/Models/Session.model';
import { UserModel } from './Infra/Models/User.model';
import { GetCurrentUserHandler } from './Infra/Queries/GetCurrentUser.query';
import { TypeOrmSessionRepository } from './Infra/Repositories/Session.repository';
import { TypeOrmUserRepository } from './Infra/Repositories/User.repository';
import { Argon2PasswordHasher } from './Infra/Services/Argon2PasswordHasher';
import {
  AuthServiceImpl,
  INVITE_CODE,
  MIN_INVITE_LENGTH,
} from './Infra/Services/Auth.service';
import { SystemAuthClock } from './Infra/Services/SystemAuthClock';

@Module({
  // O Finance prepara a conta nova (categorias padrão): ACCOUNT_SETUP vem dele.
  imports: [TypeOrmModule.forFeature([UserModel, SessionModel]), FinanceModule],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: SESSION_REPOSITORY, useClass: TypeOrmSessionRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: AUTH_CLOCK, useClass: SystemAuthClock },
    {
      provide: INVITE_CODE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): string => {
        const code = config.get<string>('INVITE_CODE') ?? '';

        if (code.length < MIN_INVITE_LENGTH) {
          new Logger('Auth').warn(
            `INVITE_CODE ausente ou com menos de ${MIN_INVITE_LENGTH} caracteres: o cadastro está fechado`,
          );
        }

        return code;
      },
    },
    { provide: AUTH_SERVICE, useClass: AuthServiceImpl },
    { provide: GET_CURRENT_USER_QUERY, useClass: GetCurrentUserHandler },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
