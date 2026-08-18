import React, { useRef, useState, useEffect, useCallback } from 'react';
import { DRAWING_PALETTE, Stroke, StrokePoint } from '@party-draw/shared';
import { RotateCcw, Trash2, Eraser, PenTool, Sparkles } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

interface MobileCanvasProps {
  wordText: string;
  category: string;
}

export const MobileCanvas: React.FC<MobileCanvasProps> = ({ wordText, category }) => {
  const { sendStrokePoint, sendStrokeEnd, clearCanvas, undoStroke, activeStrokes } = useSocket();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [brushWidth, setBrushWidth] = useState<number>(0.008); // Normalized width
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<StrokePoint | null>(null);

  // Redraw all strokes for undo / initial load / resize
  const redrawAllStrokes = useCallback((strokes: Stroke[]) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.isEraser ? '#FFFFFF' : stroke.color;
      ctx.lineWidth = Math.max(2, stroke.width * Math.min(w, h));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const first = stroke.points[0];
      ctx.moveTo(first.x * w, first.y * h);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x * w, pt.y * h);
      }
      ctx.stroke();
    });
  }, []);

  // Resize canvas based on device pixel ratio
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.resetTransform?.();
        ctx.scale(dpr, dpr);
      }

      redrawAllStrokes(activeStrokes);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeStrokes, redrawAllStrokes]);

  // Sync canvas redraw on undo / server stroke changes
  useEffect(() => {
    if (!isDrawingRef.current) {
      redrawAllStrokes(activeStrokes);
    }
  }, [activeStrokes, redrawAllStrokes]);

  const getNormalizedPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}

    const point = getNormalizedPoint(e);
    if (!point) return;

    isDrawingRef.current = true;
    lastPointRef.current = point;

    // Draw local dot immediately
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.beginPath();
      ctx.fillStyle = isEraser ? '#FFFFFF' : selectedColor;
      const radius = Math.max(1, (brushWidth * Math.min(w, h)) / 2);
      ctx.arc(point.x * w, point.y * h, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    sendStrokePoint(point, selectedColor, brushWidth, isEraser, true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current || !lastPointRef.current) return;

    const currentPoint = getNormalizedPoint(e);
    if (!currentPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.beginPath();
      ctx.strokeStyle = isEraser ? '#FFFFFF' : selectedColor;
      ctx.lineWidth = Math.max(2, brushWidth * Math.min(w, h));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(lastPointRef.current.x * w, lastPointRef.current.y * h);
      ctx.lineTo(currentPoint.x * w, currentPoint.y * h);
      ctx.stroke();
    }

    sendStrokePoint(currentPoint, selectedColor, brushWidth, isEraser, false);
    lastPointRef.current = currentPoint;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      sendStrokeEnd();
    }
  };

  const handleLocalClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    clearCanvas();
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 select-none touch-none max-w-lg mx-auto">
      {/* Secret Word Prompt Box */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 p-0.5 rounded-2xl shadow-xl mb-1.5 flex-shrink-0">
        <div className="bg-slate-950 px-4 py-2 rounded-[14px] flex items-center justify-between">
          <div className="overflow-hidden">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center space-x-1">
              <Sparkles size={11} />
              <span>TU PALABRA ({category})</span>
            </span>
            <h3 className="font-game font-black text-xl sm:text-2xl text-white tracking-wide uppercase truncate">
              {wordText}
            </h3>
          </div>
          <span className="text-2xl ml-2 flex-shrink-0 animate-bounce-short">🤫</span>
        </div>
      </div>

      {/* Responsive Drawing Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full relative bg-white rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 min-h-[280px]"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full block cursor-crosshair touch-none"
        />
      </div>

      {/* Toolbar: Colors + Brush Sizes + Actions */}
      <div className="mt-2 space-y-2 bg-slate-900/95 border border-slate-800 p-2.5 rounded-2xl shadow-2xl flex-shrink-0 safe-bottom">
        {/* Colors Palette */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
          {DRAWING_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                setSelectedColor(color);
                setIsEraser(false);
              }}
              style={{ backgroundColor: color }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all flex-shrink-0 ${
                !isEraser && selectedColor === color
                  ? 'scale-125 border-white shadow-lg ring-2 ring-indigo-500'
                  : 'border-slate-700 opacity-80 hover:opacity-100'
              }`}
            />
          ))}
        </div>

        {/* Tools row */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
          {/* Brush Sizes */}
          <div className="flex items-center space-x-1.5">
            {[
              { size: 0.005, label: 'Fino' },
              { size: 0.012, label: 'Medio' },
              { size: 0.024, label: 'Grueso' }
            ].map(({ size, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setBrushWidth(size)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  brushWidth === size
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setIsEraser(!isEraser)}
              className={`p-2 rounded-xl border transition-all ${
                isEraser
                  ? 'bg-pink-600 text-white border-pink-500 shadow-md scale-105'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Goma de borrar"
            >
              <Eraser size={18} />
            </button>

            <button
              type="button"
              onClick={undoStroke}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all active:scale-90"
              title="Deshacer trazo"
            >
              <RotateCcw size={18} />
            </button>

            <button
              type="button"
              onClick={handleLocalClear}
              className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 transition-all active:scale-90"
              title="Borrar todo"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
