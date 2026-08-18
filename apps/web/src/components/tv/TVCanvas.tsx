import React, { useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { SERVER_EVENTS, Stroke, StrokePoint } from '@party-draw/shared';

interface TVCanvasProps {
  className?: string;
}

export const TVCanvas: React.FC<TVCanvasProps> = ({ className = '' }) => {
  const { socket, activeStrokes } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastPointRef = useRef<StrokePoint | null>(null);

  // Helper to re-render all strokes
  const redrawAllStrokes = (strokes: Stroke[]) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Reset transform before clearing the physical buffer
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw strokes in CSS coordinate space
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
  };

  // Resize canvas according to container dimensions
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
  }, [activeStrokes]);

  // Real-time incremental stroke listener
  useEffect(() => {
    if (!socket) return;

    const handleStrokeReceived = (data: {
      point: StrokePoint;
      color: string;
      width: number;
      isEraser: boolean;
      isNewStroke: boolean;
    }) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const currentX = data.point.x * w;
      const currentY = data.point.y * h;

      if (data.isNewStroke || !lastPointRef.current) {
        lastPointRef.current = data.point;
        ctx.beginPath();
        ctx.fillStyle = data.isEraser ? '#FFFFFF' : data.color;
        const radius = Math.max(1, (data.width * Math.min(w, h)) / 2);
        ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      const prevX = lastPointRef.current.x * w;
      const prevY = lastPointRef.current.y * h;

      ctx.beginPath();
      ctx.strokeStyle = data.isEraser ? '#FFFFFF' : data.color;
      ctx.lineWidth = Math.max(2, data.width * Math.min(w, h));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(prevX, prevY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      lastPointRef.current = data.point;
    };

    const handleCanvasCleared = () => {
      lastPointRef.current = null;
      redrawAllStrokes([]);
    };

    socket.on(SERVER_EVENTS.STROKE_RECEIVED, handleStrokeReceived);
    socket.on(SERVER_EVENTS.CANVAS_CLEARED, handleCanvasCleared);

    return () => {
      socket.off(SERVER_EVENTS.STROKE_RECEIVED, handleStrokeReceived);
      socket.off(SERVER_EVENTS.CANVAS_CLEARED, handleCanvasCleared);
    };
  }, [socket]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700/80 ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
