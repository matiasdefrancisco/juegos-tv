import React from 'react';

interface ScreenProps {
  /** Barra superior fija (no scrollea) */
  header?: React.ReactNode;
  /** Barra inferior fija (no scrollea) */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /**
   * false para pantallas cuyo cuerpo no debe scrollear nunca, como el lienzo
   * de dibujo a pantalla completa. Por defecto el cuerpo scrollea.
   */
  scrollable?: boolean;
  className?: string;
  bodyClassName?: string;
}

/**
 * Envoltorio de pantalla completa.
 *
 * Garantiza dos cosas en todas las vistas:
 *  - el alto mínimo es el del viewport, sin recortar contenido;
 *  - si el contenido no entra, el cuerpo scrollea en vez de quedar inaccesible.
 *
 * Header y footer quedan siempre visibles; solo scrollea el centro.
 */
export const Screen: React.FC<ScreenProps> = ({
  header,
  footer,
  children,
  scrollable = true,
  className = '',
  bodyClassName = ''
}) => {
  return (
    <div className={`screen-root party-bg-ambient text-white select-none ${className}`}>
      {header && <div className="flex-shrink-0">{header}</div>}

      <main className={`${scrollable ? 'screen-body' : 'screen-body-fixed'} ${bodyClassName}`}>
        {children}
      </main>

      {footer && <div className="flex-shrink-0">{footer}</div>}
    </div>
  );
};

/**
 * Contenedor centrado para el contenido de una pantalla.
 * `min-h-full` mantiene el centrado vertical cuando sobra espacio, pero deja
 * crecer y scrollear cuando falta.
 */
export const ScreenContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** Ancho máximo del contenido */
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  center?: boolean;
}> = ({ children, className = '', width = 'lg', center = true }) => {
  const widths: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-5xl',
    xl: 'max-w-7xl',
    full: 'max-w-none'
  };

  return (
    <div
      className={`w-full ${widths[width]} mx-auto px-4 sm:px-6 py-4 sm:py-6 ${
        center ? 'min-h-full flex flex-col justify-center' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
