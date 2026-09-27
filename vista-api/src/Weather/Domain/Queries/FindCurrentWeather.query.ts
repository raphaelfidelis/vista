import { Coordinates } from '../Coordinates';
import { WeatherCondition } from '../WeatherCondition';

export const FIND_CURRENT_WEATHER_QUERY = Symbol('FindCurrentWeatherQuery');

export interface CurrentWeatherDto {
  temperature: number;
  condition: WeatherCondition;
  isDay: boolean;
}

export interface FindCurrentWeatherQuery {
  execute(coordinates: Coordinates): Promise<CurrentWeatherDto>;
}
