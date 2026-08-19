import React, { useCallback, useEffect, useRef } from 'react';
import { useCanvasStrokes, useSocketConnection } from '../../context/SocketContext';
import { SERVER_EVENTS, Stroke, StrokePoint, StrokeReceivedPayload } from '@party-draw/shared';
import { drawDot, drawPolyline, fitCanvasToContainer, redrawStrokes } from '../../utils/canvasDraw';

interface TVCanvasProps {
  className?: string;
}

/**
 * Se suscribe solo a la conexión y a los trazos: un cambio de puntaje o de
 * turno no tiene por qué re-renderizar el lienzo.
 */
const TVCanvasBase: React.FC<TVCanvasProps> = ({ className = '' }) => {
  const { socket } = useSocketConnection();
  const { activeStrokes } = useCanvasStrokes();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastPointRef = useRef<StrokePoint | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  // Copia viva de los trazos para poder redibujar sin re-suscribir los listeners
  const strokesRef = useRef<Stroke[]>(activeStrokes);

  const repaint = useCallback((strokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = sizeRef.current;
    if (width === 0 || height === 0) return;
    redrawStrokes(canvas, strokes, width, height);
  }, []);

  // Reajuste ante cambios de tamaño (rotación, cambio de resolución de la TV)
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const handleResize = () => {
      const size = fitCanvasToContainer(canvas, container);
      if (!size) return;
      sizeRef.current = size;
      repaint(strokesRef.current);
    };

    handleResize();

    // ResizeObserver capta también los cambios de layout, no solo los de ventana
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [repaint]);

  // Redibujo completo cuando llega un lienzo sincronizado (undo, reconexión, ronda nueva)
  useEffect(() => {
    strokesRef.current = activeStrokes;
    lastPointRef.current = null;
    repaint(activeStrokes);
  }, [activeStrokes, repaint]);

  // Trazado incremental en vivo
  useEffect(() => {
    if (!socket) return;

    const handleStrokeReceived = (data: StrokeReceivedPayload) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width: w, height: h } = sizeRef.current;
      if (w === 0 || h === 0) return;

      const points = data.points;
      if (!points || points.length === 0) return;

      let from = data.isNewStroke ? null : lastPointRef.current;

      // Un punto suelto al abrir el trazo se pinta como redondel
      if (!from) {
        drawDot(ctx, points[0], data.color, data.width, data.isEraser, w, h);
        from = points[0];
      }

      // Todo el lote en un solo path: una TV no aguanta un stroke() por punto
      drawPolyline(
        ctx,
        from,
        points,
        data.color,
        data.width,
        data.isEraser,
        w,
        h
      );

      lastPointRef.current = points[points.length - 1];
    };

    const handleCanvasCleared = () => {
      lastPointRef.current = null;
      strokesRef.current = [];
      repaint([]);
    };

    socket.on(SERVER_EVENTS.STROKE_RECEIVED, handleStrokeReceived);
    socket.on(SERVER_EVENTS.CANVAS_CLEARED, handleCanvasCleared);

    return () => {
      socket.off(SERVER_EVENTS.STROKE_RECEIVED, handleStrokeReceived);
      socket.off(SERVER_EVENTS.CANVAS_CLEARED, handleCanvasCleared);
    };
  }, [socket, repaint]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700/80 ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

/** memo: el padre se re-renderiza en cada estado, el lienzo no necesita seguirlo */
export const TVCanvas = React.memo(TVCanvasBase);
