import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';
import { AuthAccountNotFoundError } from '../Domain/Errors/AuthAccountNotFound.error';
import { AuthEmailTakenError } from '../Domain/Errors/AuthEmailTaken.error';
import { AuthInvalidCredentialsError } from '../Domain/Errors/AuthInvalidCredentials.error';
import { AuthInvalidInviteError } from '../Domain/Errors/AuthInvalidInvite.error';
import { AuthTooManyAttemptsError } from '../Domain/Errors/AuthTooManyAttempts.error';
import { AuthUnauthenticatedError } from '../Domain/Errors/AuthUnauthenticated.error';
import { AuthValidationError } from '../Domain/Errors/AuthValidation.error';

type AuthDomainError =
  | AuthValidationError
  | AuthInvalidCredentialsError
  | AuthUnauthenticatedError
  | AuthInvalidInviteError
  | AuthEmailTakenError
  | AuthAccountNotFoundError
  | AuthTooManyAttemptsError;

function toHttp(exception: AuthDomainError): HttpException {
  if (exception instanceof AuthValidationError) {
    return new BadRequestException(exception.message);
  }

  if (
    exception instanceof AuthInvalidCredentialsError ||
    exception instanceof AuthUnauthenticatedError
  ) {
    return new UnauthorizedException(exception.message);
  }

  if (exception instanceof AuthInvalidInviteError) {
    return new ForbiddenException(exception.message);
  }

  if (exception instanceof AuthAccountNotFoundError) {
    return new NotFoundException(exception.message);
  }

  if (exception instanceof AuthTooManyAttemptsError) {
    return new HttpException(exception.message, HttpStatus.TOO_MANY_REQUESTS);
  }

  return new ConflictException(exception.message);
}

/** Traduz os erros de conta para HTTP. O domínio não sabe que existe HTTP. */
@Catch(
  AuthValidationError,
  AuthInvalidCredentialsError,
  AuthUnauthenticatedError,
  AuthInvalidInviteError,
  AuthEmailTakenError,
  AuthAccountNotFoundError,
  AuthTooManyAttemptsError,
)
export class AuthExceptionFilter extends BaseExceptionFilter {
  catch(exception: AuthDomainError, host: ArgumentsHost): void {
    if (exception instanceof AuthTooManyAttemptsError) {
      host
        .switchToHttp()
        .getResponse<Response>()
        .setHeader('Retry-After', String(exception.retryAfterSeconds));
    }

    super.catch(toHttp(exception), host);
  }
}
