/**
 * Marcas diacríticas combinantes (rango U+0300–U+036F).
 * Se construye con new RegExp para que el archivo quede en ASCII puro y el
 * patrón no dependa de la codificación con la que se guarde el fuente.
 */
const DIACRITICS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g');
/** Palabras vacías que no deberían decidir si una respuesta es correcta */
const STOP_WORDS = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'al', 'a', 'y', 'o', 'en', 'con'
]);
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
export function normalizeAnswer(text) {
    if (!text)
        return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(DIACRITICS_REGEX, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
/** Versión sin artículos ni conectores, para aceptar "señor de los anillos" */
export function stripStopWords(normalized) {
    const kept = normalized.split(' ').filter((w) => w && !STOP_WORDS.has(w));
    // Si todo eran artículos, se devuelve el original para no comparar contra vacío
    return kept.length > 0 ? kept.join(' ') : normalized;
}
/**
 * Todas las formas aceptables de una palabra: texto, aliases, y cada una
 * también sin artículos. Se usa tanto para acertar como para medir cercanía.
 */
export function getAcceptedForms(word) {
    const raw = [word.text, ...(word.aliases || [])];
    const forms = new Set();
    for (const item of raw) {
        const normalized = normalizeAnswer(item);
        if (!normalized)
            continue;
        forms.add(normalized);
        forms.add(stripStopWords(normalized));
    }
    return Array.from(forms);
}
/** ¿La respuesta coincide exactamente con alguna forma aceptada? */
export function isAnswerCorrect(guess, word) {
    const normalizedGuess = normalizeAnswer(guess);
    if (!normalizedGuess)
        return false;
    const guessForms = new Set([normalizedGuess, stripStopWords(normalizedGuess)]);
    return getAcceptedForms(word).some((form) => guessForms.has(form));
}
/**
 * Longitud de cada palabra de la respuesta, para dibujar la pista en pantalla.
 * "Volver al Futuro" -> [6, 2, 6]
 */
export function getWordPattern(text) {
    const normalized = normalizeAnswer(text);
    if (!normalized)
        return [];
    return normalized.split(' ').map((w) => w.length);
}
/** Sanea el nombre de un jugador (2 a 15 caracteres, sin HTML) */
export function sanitizePlayerName(rawName) {
    if (!rawName)
        return 'Jugador';
    const cleaned = rawName
        .replace(/[<>'"&/\\]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 15);
    return cleaned.length >= 2 ? cleaned : `Jugador ${Math.floor(100 + Math.random() * 900)}`;
}
/** Código de sala de 4 caracteres, sin caracteres ambiguos (I, O, 0, 1) */
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateRoomCode() {
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
    return code;
}
/** Distancia de edición entre dos cadenas */
export function levenshteinDistance(a, b) {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0)
        return bn;
    if (bn === 0)
        return an;
    const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
    for (let i = 0; i <= an; i++)
        matrix[0][i] = i;
    for (let j = 0; j <= bn; j++)
        matrix[j][0] = j;
    for (let j = 1; j <= bn; j++) {
        for (let i = 1; i <= an; i++) {
            if (b[j - 1] === a[i - 1]) {
                matrix[j][i] = matrix[j - 1][i - 1];
            }
            else {
                matrix[j][i] = Math.min(matrix[j - 1][i - 1] + 1, matrix[j][i - 1] + 1, matrix[j - 1][i] + 1);
            }
        }
    }
    return matrix[bn][an];
}
/** Tolerancia de tipeo proporcional al largo: una frase admite más errores que una palabra */
function toleranceFor(length) {
    if (length < 4)
        return 0;
    if (length <= 7)
        return 1;
    if (length <= 14)
        return 2;
    return 3;
}
/**
 * ¿La respuesta estuvo cerca? Contempla errores de tipeo y también títulos
 * largos a los que les falta o les sobra alguna palabra.
 */
export function isGuessClose(guess, word) {
    const normalizedGuess = normalizeAnswer(guess);
    if (!normalizedGuess)
        return false;
    const guessWords = stripStopWords(normalizedGuess).split(' ').filter(Boolean);
    for (const form of getAcceptedForms(word)) {
        if (form.length < 3)
            continue;
        const distance = levenshteinDistance(normalizedGuess, form);
        if (distance > 0 && distance <= toleranceFor(form.length))
            return true;
        // Títulos: acierta la mayoría de las palabras significativas
        const formWords = form.split(' ').filter(Boolean);
        if (formWords.length > 1 && guessWords.length > 0) {
            const shared = formWords.filter((w) => guessWords.includes(w)).length;
            if (shared >= Math.ceil(formWords.length / 2) && shared < formWords.length)
                return true;
        }
    }
    return false;
}
