import { Coordinates } from '../Coordinates';
import { Weather } from '../Weather';

export const WEATHER_REPOSITORY = Symbol('WeatherRepository');

export interface WeatherRepository {
  findCurrent(coordinates: Coordinates): Promise<Weather>;
}
