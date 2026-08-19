import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Lienzo lógico de la vista de TV.
 *
 * Todas las pantallas de TV se diseñan sobre una caja fija de 1920x1080 y
 * después se escalan con una sola `transform` para entrar completas en el
 * viewport real, sea un televisor 4K, un monitor 16:10 o una notebook.
 *
 * Por qué así y no con layout fluido:
 *  - Una TV no tiene forma cómoda de scrollear, así que el contenido tiene que
 *    entrar entero, siempre. Con un lienzo fijo eso está garantizado por
 *    construcción: si entra en 1920x1080, entra en cualquier lado.
 *  - Es más barato: el navegador resuelve el layout una vez y después solo
 *    compone una transform (acelerada por GPU). Sin reflows por resize.
 */
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

/**
 * Margen de seguridad por overscan: muchos televisores recortan un 2-5% de los
 * bordes. El contenido vivo se mantiene dentro de este margen.
 */
export const STAGE_SAFE_INSET = 48;

interface TVStageProps {
  children: React.ReactNode;
}

export const TVStage: React.FC<TVStageProps> = ({ children }) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(() =>
    typeof window === 'undefined'
      ? 1
      : Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT)
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const apply = (width: number, height: number) => {
      if (width === 0 || height === 0) return;
      // El menor de los dos factores asegura que entren ancho y alto
      const next = Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT);
      setScale((prev) => (Math.abs(prev - next) < 0.0005 ? prev : next));
    };

    const measure = () => {
      const rect = viewport.getBoundingClientRect();
      apply(rect.width, rect.height);
    };

    measure();

    /**
     * ResizeObserver y no solo `window.resize`: varios navegadores de TV no
     * emiten resize al cambiar de resolución, al entrar en pantalla completa o
     * al aparecer/desaparecer su barra de sistema. Observar el contenedor real
     * cubre todos esos casos.
     */
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentRect;
      apply(box.width, box.height);
    });

    observer.observe(viewport);

    /**
     * Mientras la pestaña está oculta el navegador no entrega callbacks de
     * ResizeObserver, así que al volver hay que medir de nuevo: la TV pudo
     * haber cambiado de resolución mientras la app estaba en segundo plano.
     */
    const onVisible = () => {
      if (document.visibilityState === 'visible') measure();
    };

    // Refuerzos: algunos televisores solo avisan por estos eventos
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    document.addEventListener('fullscreenchange', measure);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      document.removeEventListener('fullscreenchange', measure);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Red de seguridad: si el primer render midió antes de tener tamaño final,
  // se vuelve a medir en el frame siguiente.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const next = Math.min(rect.width / STAGE_WIDTH, rect.height / STAGE_HEIGHT);
      setScale((prev) => (Math.abs(prev - next) < 0.0005 ? prev : next));
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div className="tv-viewport" ref={viewportRef}>
      <div
        className="tv-stage"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `scale(${scale})`
        }}
      >
        {children}
      </div>
    </div>
  );
};
