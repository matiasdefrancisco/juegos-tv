import confetti from 'canvas-confetti';

/**
 * Celebraciones con confeti, calibradas según el equipo.
 *
 * El confeti dibuja cada partícula en un canvas a 60 fps. En un televisor eso
 * compite con el propio render del juego, así que en pantallas grandes se usa
 * una versión mucho más liviana, y con "reducir movimiento" activado no se usa.
 */

function reduceMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Se considera TV a partir de esta altura de viewport */
function isBigScreen(): boolean {
  return window.innerWidth >= 1280;
}

/** Estallido corto, para un acierto individual en el celular */
export function celebrateGuess(): void {
  if (reduceMotion()) return;

  confetti({
    particleCount: isBigScreen() ? 24 : 50,
    spread: 70,
    ticks: 60,
    origin: { y: 0.6 },
    disableForReducedMotion: true
  });
}

/**
 * Celebración final. Devuelve una función para cancelarla.
 * En TV son pocas ráfagas y con menos partículas; en el celular, algo más.
 */
export function celebrateWinner(): () => void {
  if (reduceMotion()) return () => {};

  const big = isBigScreen();
  const rafagas = big ? 4 : 8;
  const intervalo = big ? 700 : 400;
  const particulas = big ? 26 : 45;

  let disparadas = 0;
  const id = window.setInterval(() => {
    if (disparadas >= rafagas) {
      window.clearInterval(id);
      return;
    }
    disparadas++;

    confetti({
      particleCount: particulas,
      startVelocity: 28,
      spread: 360,
      ticks: big ? 40 : 60,
      origin: { x: Math.random(), y: Math.random() * 0.4 },
      disableForReducedMotion: true
    });
  }, intervalo);

  return () => window.clearInterval(id);
}
