import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** Barra de acciones fija al pie del modal */
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl'
};

/**
 * Diálogo con scroll interno.
 *
 * El panel nunca supera el 90% del alto del viewport y el cuerpo scrollea solo,
 * así que en notebooks el encabezado y los botones del pie siempre quedan
 * visibles por más largo que sea el contenido.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md'
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Bloquea el scroll del fondo mientras el modal está abierto
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Foco inicial dentro del panel, para que Escape y Tab funcionen
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ scale: 0.95, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className={`w-full ${SIZES[size]} max-h-[90dvh] flex flex-col bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl outline-none overflow-hidden`}
          >
            {(title || subtitle) && (
              <header className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-800 flex-shrink-0">
                <div className="min-w-0">
                  {title && (
                    <h2 className="text-xl sm:text-2xl font-black font-game text-white truncate">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="btn-ghost p-2 flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </header>
            )}

            {/* Único bloque scrollable del modal */}
            <div className="scroll-area flex-1 p-5 sm:p-6">{children}</div>

            {footer && (
              <footer className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex-shrink-0">
                {footer}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
