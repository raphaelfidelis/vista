import { Weather } from '../../Domain/Weather';
import { WeatherCondition } from '../../Domain/WeatherCondition';

/** Formato do Open-Meteo. Os nomes em snake_case são da API externa e não passam deste arquivo. */
type OpenMeteoCurrentResponse = {
  current: {
    temperature_2m: number;
    weather_code: number;
    is_day: number;
  };
};

/** Códigos WMO usados pelo Open-Meteo: https://open-meteo.com/en/docs#weather_variable_documentation */
const WMO_CONDITIONS: Partial<Record<number, WeatherCondition>> = {
  0: WeatherCondition.CLEAR,
  1: WeatherCondition.CLEAR,
  2: WeatherCondition.PARTLY_CLOUDY,
  3: WeatherCondition.CLOUDY,
  45: WeatherCondition.FOG,
  48: WeatherCondition.FOG,
  51: WeatherCondition.DRIZZLE,
  53: WeatherCondition.DRIZZLE,
  55: WeatherCondition.DRIZZLE,
  56: WeatherCondition.DRIZZLE,
  57: WeatherCondition.DRIZZLE,
  61: WeatherCondition.RAIN,
  63: WeatherCondition.RAIN,
  65: WeatherCondition.RAIN,
  66: WeatherCondition.RAIN,
  67: WeatherCondition.RAIN,
  80: WeatherCondition.RAIN,
  81: WeatherCondition.RAIN,
  82: WeatherCondition.RAIN,
  71: WeatherCondition.SNOW,
  73: WeatherCondition.SNOW,
  75: WeatherCondition.SNOW,
  77: WeatherCondition.SNOW,
  85: WeatherCondition.SNOW,
  86: WeatherCondition.SNOW,
  95: WeatherCondition.THUNDERSTORM,
  96: WeatherCondition.THUNDERSTORM,
  99: WeatherCondition.THUNDERSTORM,
};

function isOpenMeteoCurrentResponse(
  value: unknown,
): value is OpenMeteoCurrentResponse {
  if (typeof value !== 'object' || value === null || !('current' in value)) {
    return false;
  }

  const { current } = value;

  return (
    typeof current === 'object' &&
    current !== null &&
    'temperature_2m' in current &&
    typeof current.temperature_2m === 'number' &&
    'weather_code' in current &&
    typeof current.weather_code === 'number' &&
    'is_day' in current &&
    typeof current.is_day === 'number'
  );
}

export class WeatherMapper {
  static toDomain(response: unknown): Weather {
    if (!isOpenMeteoCurrentResponse(response)) {
      throw new Error('Resposta do Open-Meteo em formato inesperado');
    }

    const { temperature_2m, weather_code, is_day } = response.current;

    return new Weather(
      temperature_2m,
      WeatherMapper.toCondition(weather_code),
      is_day === 1,
    );
  }

  private static toCondition(code: number): WeatherCondition {
    const condition = WMO_CONDITIONS[code];

    if (condition === undefined) {
      throw new Error(`Código WMO desconhecido: ${code}`);
    }

    return condition;
  }
}
