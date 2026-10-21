import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Put,
  UseFilters,
} from '@nestjs/common';
import { GET_CURRENT_USER_QUERY } from '../Domain/Queries/GetCurrentUser.query';
import type {
  GetCurrentUserQuery,
  UserDto,
} from '../Domain/Queries/GetCurrentUser.query';
import { AUTH_SERVICE } from '../Domain/Services/Auth.service';
import type { AuthService } from '../Domain/Services/Auth.service';
import { AuthExceptionFilter } from './Auth.filter';
import { Public } from './Public.decorator';
import {
  ClientIp,
  CurrentSessionId,
  CurrentUserId,
} from './Request.decorators';

interface RegisterBody {
  inviteCode: string;
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface RenameBody {
  name: string;
}

interface ChangePasswordBody {
  currentPassword?: string;
  newPassword: string;
}

/** O que o web guarda no cookie: o token e quando ele vence. */
interface SessionDto {
  token: string;
  expiresAt: string;
}

@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly auth: AuthService,
    @Inject(GET_CURRENT_USER_QUERY)
    private readonly currentUser: GetCurrentUserQuery,
  ) {}

  // Os campos são copiados um a um: o corpo nunca vai inteiro para o service.
  @Public()
  @Post('register')
  async register(
    @Body() body: RegisterBody,
    @ClientIp() clientIp: string,
  ): Promise<SessionDto> {
    const session = await this.auth.register({
      inviteCode: body.inviteCode,
      name: body.name,
      email: body.email,
      password: body.password,
      clientIp,
    });

    return { token: session.token, expiresAt: session.expiresAt.toISOString() };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginBody,
    @ClientIp() clientIp: string,
  ): Promise<SessionDto> {
    const session = await this.auth.login({
      email: body.email,
      password: body.password,
      clientIp,
    });

    return { token: session.token, expiresAt: session.expiresAt.toISOString() };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentSessionId() sessionId: string): Promise<void> {
    return this.auth.logout(sessionId);
  }

  @Get('me')
  me(@CurrentUserId() userId: string): Promise<UserDto> {
    return this.currentUser.execute(userId);
  }

  @Patch('me')
  async rename(
    @CurrentUserId() userId: string,
    @Body() body: RenameBody,
  ): Promise<UserDto> {
    await this.auth.rename(userId, body.name);

    return this.currentUser.execute(userId);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentUserId() userId: string,
    @CurrentSessionId() sessionId: string,
    @Body() body: ChangePasswordBody,
  ): Promise<void> {
    return this.auth.changePassword(userId, sessionId, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
  }
}
