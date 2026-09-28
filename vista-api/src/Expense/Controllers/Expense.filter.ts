import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ExpenseCategoryAlreadyExistsError } from '../Domain/Errors/ExpenseCategoryAlreadyExists.error';
import { ExpenseCategoryInUseError } from '../Domain/Errors/ExpenseCategoryInUse.error';
import { ExpenseCategoryNotFoundError } from '../Domain/Errors/ExpenseCategoryNotFound.error';
import { ExpenseNotFoundError } from '../Domain/Errors/ExpenseNotFound.error';
import { ExpenseValidationError } from '../Domain/Errors/ExpenseValidation.error';

type ExpenseDomainError =
  | ExpenseValidationError
  | ExpenseNotFoundError
  | ExpenseCategoryNotFoundError
  | ExpenseCategoryInUseError
  | ExpenseCategoryAlreadyExistsError;

function toHttp(exception: ExpenseDomainError): HttpException {
  if (exception instanceof ExpenseValidationError) {
    return new BadRequestException(exception.message);
  }

  if (
    exception instanceof ExpenseNotFoundError ||
    exception instanceof ExpenseCategoryNotFoundError
  ) {
    return new NotFoundException(exception.message);
  }

  return new ConflictException(exception.message);
}

/** Traduz os erros do domínio de gastos para HTTP. O domínio não sabe que existe HTTP. */
@Catch(
  ExpenseValidationError,
  ExpenseNotFoundError,
  ExpenseCategoryNotFoundError,
  ExpenseCategoryInUseError,
  ExpenseCategoryAlreadyExistsError,
)
export class ExpenseExceptionFilter extends BaseExceptionFilter {
  catch(exception: ExpenseDomainError, host: ArgumentsHost): void {
    super.catch(toHttp(exception), host);
  }
}
