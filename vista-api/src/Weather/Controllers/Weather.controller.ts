import {
  Controller,
  Get,
  Inject,
  ParseFloatPipe,
  Query,
  UseFilters,
} from '@nestjs/common';
import { Coordinates } from '../Domain/Coordinates';
import { FIND_CURRENT_WEATHER_QUERY } from '../Domain/Queries/FindCurrentWeather.query';
import type {
  CurrentWeatherDto,
  FindCurrentWeatherQuery,
} from '../Domain/Queries/FindCurrentWeather.query';
import { WeatherExceptionFilter } from './Weather.filter';

@Controller('weather')
@UseFilters(WeatherExceptionFilter)
export class WeatherController {
  constructor(
    @Inject(FIND_CURRENT_WEATHER_QUERY)
    private readonly findCurrentWeather: FindCurrentWeatherQuery,
  ) {}

  @Get()
  findCurrent(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
  ): Promise<CurrentWeatherDto> {
    return this.findCurrentWeather.execute(
      new Coordinates(latitude, longitude),
    );
  }
}
