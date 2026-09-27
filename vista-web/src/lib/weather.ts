export type WeatherCondition =
  | 'CLEAR'
  | 'PARTLY_CLOUDY'
  | 'CLOUDY'
  | 'FOG'
  | 'DRIZZLE'
  | 'RAIN'
  | 'SNOW'
  | 'THUNDERSTORM';

export type CurrentWeather = {
  temperature: number;
  condition: WeatherCondition;
  isDay: boolean;
};

type ConditionPresentation = {
  label: string;
  icon: string;
  /** Ícone noturno, quando diferente do diurno. */
  nightIcon?: string;
};

const conditions: Record<WeatherCondition, ConditionPresentation> = {
  CLEAR: { label: 'Céu limpo', icon: 'clear_day', nightIcon: 'clear_night' },
  PARTLY_CLOUDY: {
    label: 'Parcialmente nublado',
    icon: 'partly_cloudy_day',
    nightIcon: 'partly_cloudy_night',
  },
  CLOUDY: { label: 'Nublado', icon: 'cloud' },
  FOG: { label: 'Neblina', icon: 'foggy' },
  DRIZZLE: { label: 'Garoa', icon: 'rainy_light' },
  RAIN: { label: 'Chuva', icon: 'rainy' },
  SNOW: { label: 'Neve', icon: 'weather_snowy' },
  THUNDERSTORM: { label: 'Tempestade', icon: 'thunderstorm' },
};

/** Todos os glifos que o clima pode exibir — entram no subset da fonte. */
export const WEATHER_ICONS = Object.values(conditions).flatMap(
  ({ icon, nightIcon }) => (nightIcon ? [icon, nightIcon] : [icon]),
);

/**
 * Os tipos são espelhados à mão do backend. Uma condição que o front ainda
 * não conhece precisa ser rejeitada aqui, e não descoberta no render.
 */
export function isCurrentWeather(value: unknown): value is CurrentWeather {
  return (
    typeof value === 'object' &&
    value !== null &&
    'temperature' in value &&
    typeof value.temperature === 'number' &&
    'isDay' in value &&
    typeof value.isDay === 'boolean' &&
    'condition' in value &&
    typeof value.condition === 'string' &&
    Object.hasOwn(conditions, value.condition)
  );
}

export function weatherIcon({ condition, isDay }: CurrentWeather): string {
  const { icon, nightIcon } = conditions[condition];

  return isDay ? icon : (nightIcon ?? icon);
}

export function weatherLabel({ condition }: CurrentWeather): string {
  return conditions[condition].label;
}
