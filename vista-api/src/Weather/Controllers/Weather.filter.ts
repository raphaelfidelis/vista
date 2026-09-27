import {
  ArgumentsHost,
  BadGatewayException,
  BadRequestException,
  Catch,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { InvalidCoordinatesError } from '../Domain/Errors/InvalidCoordinates.error';
import { WeatherProviderError } from '../Domain/Errors/WeatherProvider.error';

/** Traduz os erros do domínio para HTTP. O domínio não sabe que existe HTTP. */
@Catch(InvalidCoordinatesError, WeatherProviderError)
export class WeatherExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(WeatherExceptionFilter.name);

  catch(
    exception: InvalidCoordinatesError | WeatherProviderError,
    host: ArgumentsHost,
  ): void {
    if (exception instanceof InvalidCoordinatesError) {
      super.catch(new BadRequestException(exception.message), host);
      return;
    }

    // Falha de dependência externa: 502, não 500. E o Nest não registra
    // HttpException no log, então o motivo precisa ser registrado aqui.
    this.logger.warn(exception.message);
    super.catch(new BadGatewayException(exception.message), host);
  }
}
