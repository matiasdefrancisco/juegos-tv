import { useEffect, useRef, useState } from 'react';

interface PhaseCountdown {
  /** Segundos enteros restantes hasta que la fase avanza sola */
  secondsLeft: number;
  /** Porcentaje restante (100 → 0), para barras de progreso */
  percent: number;
}

/**
 * Cuenta regresiva de una fase que el servidor va a avanzar sola.
 * `endsAt` es un timestamp absoluto del servidor, así que todas las pantallas
 * quedan sincronizadas aunque se hayan conectado en momentos distintos.
 */
export function usePhaseCountdown(endsAt: number | null | undefined): PhaseCountdown {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [percent, setPercent] = useState(100);
  const totalRef = useRef<number>(0);

  useEffect(() => {
    if (!endsAt) {
      setSecondsLeft(0);
      setPercent(100);
      return;
    }

    // La duración total se fija al entrar en la fase para que la barra no salte
    totalRef.current = Math.max(1, endsAt - Date.now());

    const tick = () => {
      const remaining = Math.max(0, endsAt - Date.now());
      setSecondsLeft(Math.ceil(remaining / 1000));
      setPercent(Math.max(0, Math.min(100, (remaining / totalRef.current) * 100)));
    };

    tick();
    const interval = window.setInterval(tick, 100);
    return () => window.clearInterval(interval);
  }, [endsAt]);

  return { secondsLeft, percent };
}
