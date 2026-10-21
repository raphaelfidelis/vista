import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { FinanceDuplicateError } from '../Domain/Errors/FinanceDuplicate.error';
import { FinanceInUseError } from '../Domain/Errors/FinanceInUse.error';
import { FinanceNotFoundError } from '../Domain/Errors/FinanceNotFound.error';
import { FinanceValidationError } from '../Domain/Errors/FinanceValidation.error';
import { RecurringAlreadyLaunchedError } from '../Domain/Errors/RecurringAlreadyLaunched.error';

type FinanceDomainError =
  | FinanceValidationError
  | FinanceNotFoundError
  | FinanceInUseError
  | FinanceDuplicateError
  | RecurringAlreadyLaunchedError;

function toHttp(exception: FinanceDomainError): HttpException {
  if (exception instanceof FinanceValidationError) {
    return new BadRequestException(exception.message);
  }

  if (exception instanceof FinanceNotFoundError) {
    return new NotFoundException(exception.message);
  }

  return new ConflictException(exception.message);
}

/** Traduz os erros do domínio financeiro para HTTP. O domínio não sabe que existe HTTP. */
@Catch(
  FinanceValidationError,
  FinanceNotFoundError,
  FinanceInUseError,
  FinanceDuplicateError,
  RecurringAlreadyLaunchedError,
)
export class FinanceExceptionFilter extends BaseExceptionFilter {
  catch(exception: FinanceDomainError, host: ArgumentsHost): void {
    super.catch(toHttp(exception), host);
  }
}
