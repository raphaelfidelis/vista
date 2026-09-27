import { Injectable } from '@nestjs/common';
import { Coordinates } from '../../Domain/Coordinates';
import { WeatherProviderError } from '../../Domain/Errors/WeatherProvider.error';
import { WeatherRepository } from '../../Domain/Repositories/Weather.repository';
import { Weather } from '../../Domain/Weather';
import { WeatherMapper } from '../Mappers/Weather.mapper';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 5_000;

@Injectable()
export class OpenMeteoWeatherRepository implements WeatherRepository {
  async findCurrent(coordinates: Coordinates): Promise<Weather> {
    const url = new URL(OPEN_METEO_URL);
    url.searchParams.set('latitude', String(coordinates.latitude));
    url.searchParams.set('longitude', String(coordinates.longitude));
    url.searchParams.set('current', 'temperature_2m,weather_code,is_day');

    // Rede, timeout, status de erro ou resposta inesperada: para quem chama,
    // tudo é o mesmo fato — o provedor não entregou um clima utilizável.
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return WeatherMapper.toDomain(await response.json());
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);

      throw new WeatherProviderError(
        `Falha ao consultar o Open-Meteo: ${reason}`,
        { cause },
      );
    }
  }
}
