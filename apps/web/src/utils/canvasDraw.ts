import { Stroke, StrokePoint } from '@party-draw/shared';

const CANVAS_BACKGROUND = '#FFFFFF';

/**
 * Ajusta el buffer del canvas al tamaño real del contenedor y a la densidad de
 * pantalla, dejando el contexto listo para dibujar en coordenadas CSS.
 * Devuelve el ancho y alto en píxeles CSS.
 */
export function fitCanvasToContainer(
  canvas: HTMLCanvasElement,
  container: HTMLElement
): { width: number; height: number } | null {
  const rect = container.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  return { width: rect.width, height: rect.height };
}

/** Pinta el fondo blanco borrando todo lo anterior */
export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = CANVAS_BACKGROUND;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

/** Grosor de línea en píxeles a partir del ancho normalizado */
export function lineWidthFor(normalizedWidth: number, w: number, h: number): number {
  return Math.max(2, normalizedWidth * Math.min(w, h));
}

/** Dibuja un trazo completo. Las coordenadas llegan normalizadas en [0..1]. */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  w: number,
  h: number
): void {
  if (stroke.points.length === 0) return;

  ctx.beginPath();
  ctx.strokeStyle = stroke.isEraser ? CANVAS_BACKGROUND : stroke.color;
  ctx.lineWidth = lineWidthFor(stroke.width, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const first = stroke.points[0];

  // Un trazo de un solo punto es un toque: se pinta como punto redondo
  if (stroke.points.length === 1) {
    ctx.fillStyle = stroke.isEraser ? CANVAS_BACKGROUND : stroke.color;
    ctx.arc(first.x * w, first.y * h, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.moveTo(first.x * w, first.y * h);
  for (let i = 1; i < stroke.points.length; i++) {
    const pt = stroke.points[i];
    ctx.lineTo(pt.x * w, pt.y * h);
  }
  ctx.stroke();
}

/** Redibuja el lienzo entero desde la lista de trazos */
export function redrawStrokes(
  canvas: HTMLCanvasElement,
  strokes: Stroke[],
  w: number,
  h: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  clearCanvas(canvas);
  strokes.forEach((stroke) => drawStroke(ctx, stroke, w, h));
}

/** Punto suelto (inicio de trazo o toque simple) */
export function drawDot(
  ctx: CanvasRenderingContext2D,
  point: StrokePoint,
  color: string,
  normalizedWidth: number,
  isEraser: boolean,
  w: number,
  h: number
): void {
  ctx.beginPath();
  ctx.fillStyle = isEraser ? CANVAS_BACKGROUND : color;
  const radius = Math.max(1, lineWidthFor(normalizedWidth, w, h) / 2);
  ctx.arc(point.x * w, point.y * h, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Traza un lote entero de puntos en un solo path.
 *
 * Importa en TV: un `beginPath()/stroke()` por punto satura la GPU de un
 * televisor. Con un único path por lote el costo baja de ~20 llamadas por
 * mensaje a una sola.
 */
export function drawPolyline(
  ctx: CanvasRenderingContext2D,
  from: StrokePoint,
  points: StrokePoint[],
  color: string,
  normalizedWidth: number,
  isEraser: boolean,
  w: number,
  h: number
): void {
  if (points.length === 0) return;

  ctx.beginPath();
  ctx.strokeStyle = isEraser ? CANVAS_BACKGROUND : color;
  ctx.lineWidth = lineWidthFor(normalizedWidth, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.moveTo(from.x * w, from.y * h);
  for (const point of points) {
    ctx.lineTo(point.x * w, point.y * h);
  }
  ctx.stroke();
}

/** Segmento entre dos puntos consecutivos, para el trazado en vivo */
export function drawSegment(
  ctx: CanvasRenderingContext2D,
  from: StrokePoint,
  to: StrokePoint,
  color: string,
  normalizedWidth: number,
  isEraser: boolean,
  w: number,
  h: number
): void {
  ctx.beginPath();
  ctx.strokeStyle = isEraser ? CANVAS_BACKGROUND : color;
  ctx.lineWidth = lineWidthFor(normalizedWidth, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(from.x * w, from.y * h);
  ctx.lineTo(to.x * w, to.y * h);
  ctx.stroke();
}
