import { isCurrentWeather, type CurrentWeather } from '@/lib/weather';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL não definida. Crie o .env.local.');
}

/**
 * Base terminada em barra e caminhos relativos: `new URL('/weather', base)`
 * descartaria um prefixo como `/api` da base.
 */
const API_BASE = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;

/** Duas casas decimais (~1 km): mais fino que a grade do Open-Meteo, e a posição exata não sai do navegador. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeather> {
  const url = new URL('weather', API_BASE);
  url.searchParams.set('latitude', String(round(latitude)));
  url.searchParams.set('longitude', String(round(longitude)));

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao buscar o clima: ${response.status}`);
  }

  const body: unknown = await response.json();

  if (!isCurrentWeather(body)) {
    throw new Error('Resposta do clima em formato inesperado');
  }

  return body;
}
