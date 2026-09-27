import { Inject, Injectable } from '@nestjs/common';
import { Coordinates } from '../../Domain/Coordinates';
import {
  CurrentWeatherDto,
  FindCurrentWeatherQuery,
} from '../../Domain/Queries/FindCurrentWeather.query';
import type { WeatherRepository } from '../../Domain/Repositories/Weather.repository';
import { WEATHER_REPOSITORY } from '../../Domain/Repositories/Weather.repository';

@Injectable()
export class FindCurrentWeatherHandler implements FindCurrentWeatherQuery {
  constructor(
    @Inject(WEATHER_REPOSITORY)
    private readonly repository: WeatherRepository,
  ) {}

  async execute(coordinates: Coordinates): Promise<CurrentWeatherDto> {
    const weather = await this.repository.findCurrent(coordinates);

    return {
      temperature: weather.temperature,
      condition: weather.condition,
      isDay: weather.isDay,
    };
  }
}
