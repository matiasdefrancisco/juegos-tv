import { Word } from './types.js';
/**
 * Normaliza una respuesta:
 * 1. minúsculas
 * 2. sin tildes ni diéresis (Pingüino -> pinguino)
 * 3. sin puntuación
 * 4. espacios colapsados
 *
 * Conserva los espacios internos: las respuestas de varias palabras
 * ("El Señor de los Anillos") son válidas y se comparan completas.
 */
export declare function normalizeAnswer(text: string): string;
/** Versión sin artículos ni conectores, para aceptar "señor de los anillos" */
export declare function stripStopWords(normalized: string): string;
/**
 * Todas las formas aceptables de una palabra: texto, aliases, y cada una
 * también sin artículos. Se usa tanto para acertar como para medir cercanía.
 */
export declare function getAcceptedForms(word: Pick<Word, 'text' | 'aliases'>): string[];
/** ¿La respuesta coincide exactamente con alguna forma aceptada? */
export declare function isAnswerCorrect(guess: string, word: Pick<Word, 'text' | 'aliases'>): boolean;
/**
 * Longitud de cada palabra de la respuesta, para dibujar la pista en pantalla.
 * "Volver al Futuro" -> [6, 2, 6]
 */
export declare function getWordPattern(text: string): number[];
/** Sanea el nombre de un jugador (2 a 15 caracteres, sin HTML) */
export declare function sanitizePlayerName(rawName: string): string;
export declare function generateRoomCode(): string;
/** Distancia de edición entre dos cadenas */
export declare function levenshteinDistance(a: string, b: string): number;
/**
 * ¿La respuesta estuvo cerca? Contempla errores de tipeo y también títulos
 * largos a los que les falta o les sobra alguna palabra.
 */
export declare function isGuessClose(guess: string, word: Pick<Word, 'text' | 'aliases'>): boolean;
//# sourceMappingURL=utils.d.ts.map