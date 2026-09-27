'use client';

import { useEffect, useState } from 'react';
import { weatherIcon, weatherLabel, type CurrentWeather } from '@/lib/weather';
import { fetchCurrentWeather } from '@/lib/weather.api';

/** O Open-Meteo atualiza as condições atuais a cada 15 minutos. */
const REFRESH_MS = 15 * 60_000;

export function Weather() {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return;
    }

    // Desmontado, nenhum callback pendente pode mais alterar o estado.
    let active = true;

    // A posição é pedida a cada ciclo, não só na montagem: quem muda de
    // lugar com a página aberta passa a ver o clima do lugar novo.
    function load() {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          fetchCurrentWeather(coords.latitude, coords.longitude)
            .then((data) => {
              if (active) setWeather(data);
            })
            .catch(() => {
              if (active) setWeather(null);
            });
        },
        (error) => {
          if (active) setWeather(null);

          // Negada, ou pedido dispensado: continuar só faria o navegador
          // pedir permissão de novo a cada ciclo.
          if (error.code === error.PERMISSION_DENIED) {
            clearInterval(timer);
          }
        },
        { maximumAge: REFRESH_MS },
      );
    }

    const timer = setInterval(load, REFRESH_MS);
    load();

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  if (!weather) {
    return null;
  }

  const label = weatherLabel(weather);

  return (
    <span className="text-muted flex items-center gap-1.5 text-[11px] tracking-[0.1em]">
      {/* O title fica no ícone oculto: tooltip para quem passa o mouse, sem
          ser anunciado de novo pelo leitor de tela, que já lê o sr-only. */}
      <span aria-hidden title={label} className="icon text-base">
        {weatherIcon(weather)}
      </span>
      <span className="sr-only">{label}</span>
      {Math.round(weather.temperature)}°C
    </span>
  );
}
