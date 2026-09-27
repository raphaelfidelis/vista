import { Module } from '@nestjs/common';
import { WeatherController } from './Controllers/Weather.controller';
import { FIND_CURRENT_WEATHER_QUERY } from './Domain/Queries/FindCurrentWeather.query';
import { WEATHER_REPOSITORY } from './Domain/Repositories/Weather.repository';
import { FindCurrentWeatherHandler } from './Infra/Queries/FindCurrentWeather.query';
import { OpenMeteoWeatherRepository } from './Infra/Repositories/Weather.repository';

@Module({
  controllers: [WeatherController],
  providers: [
    {
      provide: WEATHER_REPOSITORY,
      useClass: OpenMeteoWeatherRepository,
    },
    {
      provide: FIND_CURRENT_WEATHER_QUERY,
      useClass: FindCurrentWeatherHandler,
    },
  ],
})
export class WeatherModule {}
