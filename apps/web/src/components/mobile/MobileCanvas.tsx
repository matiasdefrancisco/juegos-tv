import React, { useRef, useState, useEffect, useCallback } from 'react';
import { DRAWING_PALETTE, Stroke, StrokePoint } from '@party-draw/shared';
import { Eraser, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { useCanvasStrokes, useSocketActions } from '../../context/SocketContext';
import {
  clearCanvas as clearCanvasSurface,
  drawDot,
  drawSegment,
  fitCanvasToContainer,
  redrawStrokes
} from '../../utils/canvasDraw';

interface MobileCanvasProps {
  wordText: string;
  category: string;
}

/** Distancia mínima entre puntos enviados: recorta tráfico sin que se note */
const MIN_POINT_DISTANCE = 0.004;

const BRUSH_SIZES = [
  { size: 0.005, label: 'Fino' },
  { size: 0.012, label: 'Medio' },
  { size: 0.024, label: 'Grueso' }
];

export const MobileCanvas: React.FC<MobileCanvasProps> = ({ wordText, category }) => {
  const { sendStrokePoint, sendStrokeEnd, clearCanvas, undoStroke } = useSocketActions();
  const { activeStrokes } = useCanvasStrokes();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [brushWidth, setBrushWidth] = useState<number>(0.012);
  const [isEraser, setIsEraser] = useState<boolean>(false);

  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<StrokePoint | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const strokesRef = useRef<Stroke[]>(activeStrokes);

  // Los handlers se registran una vez y leen la herramienta activa por ref
  const toolRef = useRef({ color: selectedColor, width: brushWidth, isEraser });
  toolRef.current = { color: selectedColor, width: brushWidth, isEraser };

  const repaint = useCallback((strokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = sizeRef.current;
    if (width === 0 || height === 0) return;
    redrawStrokes(canvas, strokes, width, height);
  }, []);

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

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [repaint]);

  useEffect(() => {
    strokesRef.current = activeStrokes;
    if (!isDrawingRef.current) repaint(activeStrokes);
  }, [activeStrokes, repaint]);

  const getNormalizedPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;

      return {
        x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
      };
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* algunos navegadores lo rechazan; el trazo funciona igual */
    }

    const point = getNormalizedPoint(e);
    if (!point) return;

    isDrawingRef.current = true;
    lastPointRef.current = point;

    const ctx = canvas.getContext('2d');
    const { width: w, height: h } = sizeRef.current;
    const { color, width, isEraser: eraser } = toolRef.current;

    if (ctx && w > 0) drawDot(ctx, point, color, width, eraser, w, h);
    sendStrokePoint(point, color, width, eraser, true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    e.preventDefault();

    const currentPoint = getNormalizedPoint(e);
    if (!currentPoint) return;

    const last = lastPointRef.current;
    if (Math.hypot(currentPoint.x - last.x, currentPoint.y - last.y) < MIN_POINT_DISTANCE) return;

    const ctx = canvasRef.current?.getContext('2d');
    const { width: w, height: h } = sizeRef.current;
    const { color, width, isEraser: eraser } = toolRef.current;

    if (ctx && w > 0) drawSegment(ctx, last, currentPoint, color, width, eraser, w, h);

    sendStrokePoint(currentPoint, color, width, eraser, false);
    lastPointRef.current = currentPoint;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    isDrawingRef.current = false;
    lastPointRef.current = null;
    sendStrokeEnd();
  };

  const handleLocalClear = () => {
    const canvas = canvasRef.current;
    if (canvas) clearCanvasSurface(canvas);
    isDrawingRef.current = false;
    lastPointRef.current = null;
    clearCanvas();
  };

  return (
    <div className="w-full h-full flex flex-col gap-2 p-2 select-none touch-none max-w-lg mx-auto min-h-0">
      {/* Palabra secreta */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 p-0.5 rounded-2xl shadow-xl flex-shrink-0">
        <div className="bg-slate-950 px-3 py-2 rounded-[14px] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={11} className="flex-shrink-0" />
              <span className="truncate">TU PALABRA ({category})</span>
            </span>
            <h3 className="font-game font-black text-lg sm:text-2xl text-white tracking-wide uppercase truncate">
              {wordText}
            </h3>
          </div>
          <span className="text-xl flex-shrink-0" aria-hidden="true">
            🤫
          </span>
        </div>
      </div>

      {/* Lienzo: ocupa lo que sobra sin colapsar nunca */}
      <div
        ref={containerRef}
        className="flex-1 min-h-[180px] w-full relative bg-white rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full block cursor-crosshair touch-none"
        />
      </div>

      {/* Herramientas */}
      <div className="space-y-2 panel p-2.5 flex-shrink-0 safe-bottom">
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-0.5">
          {DRAWING_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Color ${color}`}
              aria-pressed={!isEraser && selectedColor === color}
              onClick={() => {
                setSelectedColor(color);
                setIsEraser(false);
              }}
              style={{ backgroundColor: color }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all flex-shrink-0 ${
                !isEraser && selectedColor === color
                  ? 'scale-125 border-white shadow-lg ring-2 ring-indigo-500'
                  : 'border-slate-700 opacity-80'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            {BRUSH_SIZES.map(({ size, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setBrushWidth(size)}
                aria-pressed={brushWidth === size}
                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  brushWidth === size
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEraser(!isEraser)}
              aria-label="Goma de borrar"
              aria-pressed={isEraser}
              className={`p-2 rounded-lg border transition-all ${
                isEraser
                  ? 'bg-pink-600 text-white border-pink-500 shadow-md'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Eraser size={17} />
            </button>

            <button
              type="button"
              onClick={undoStroke}
              aria-label="Deshacer trazo"
              className="btn-ghost p-2 rounded-lg"
            >
              <RotateCcw size={17} />
            </button>

            <button
              type="button"
              onClick={handleLocalClear}
              aria-label="Borrar todo el dibujo"
              className="p-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 transition-all active:scale-90"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
