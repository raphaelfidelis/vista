import { WeatherCondition } from './WeatherCondition';

export class Weather {
  private _temperature: number;
  private _condition: WeatherCondition;
  private _isDay: boolean;

  constructor(
    temperature: number,
    condition: WeatherCondition,
    isDay: boolean,
  ) {
    this._temperature = temperature;
    this._condition = condition;
    this._isDay = isDay;
  }

  /** Graus Celsius. */
  get temperature(): number {
    return this._temperature;
  }

  get condition(): WeatherCondition {
    return this._condition;
  }

  get isDay(): boolean {
    return this._isDay;
  }
}
