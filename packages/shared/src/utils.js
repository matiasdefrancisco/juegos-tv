"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAnswer = normalizeAnswer;
exports.sanitizePlayerName = sanitizePlayerName;
exports.generateRoomCode = generateRoomCode;
exports.levenshteinDistance = levenshteinDistance;
exports.isGuessClose = isGuessClose;
/**
 * Normalizes an answer string by:
 * 1. Converting to lowercase
 * 2. Removing diacritics/accents (e.g. Pingüino -> pinguino, Avión -> avion)
 * 3. Removing punctuation and special characters
 * 4. Collapsing multiple spaces into one
 */
function normalizeAnswer(text) {
    if (!text)
        return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9\s]/g, '') // remove non-alphanumeric except spaces
        .replace(/\s+/g, ' ') // collapse whitespace
        .trim();
}
/**
 * Sanitizes a player's name (length 2-15, remove harmful HTML characters)
 */
function sanitizePlayerName(rawName) {
    if (!rawName)
        return 'Jugador';
    const cleaned = rawName
        .replace(/[<>'"&/]/g, '')
        .trim()
        .slice(0, 15);
    return cleaned.length >= 2 ? cleaned : `Jugador ${Math.floor(100 + Math.random() * 900)}`;
}
/**
 * Generates a clean 4-character room code without ambiguous characters (no I, O, 0, 1).
 */
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateRoomCode() {
    let code = '';
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
        code += ROOM_CODE_CHARS[randomIndex];
    }
    return code;
}
/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
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
                matrix[j][i] = Math.min(matrix[j - 1][i - 1] + 1, // substitution
                matrix[j][i - 1] + 1, // insertion
                matrix[j - 1][i] + 1 // deletion
                );
            }
        }
    }
    return matrix[bn][an];
}
/**
 * Checks if a guess is very close to the target or any aliases (1 character diff for words >= 4 letters)
 */
function isGuessClose(guess, target, aliases) {
    const normGuess = normalizeAnswer(guess);
    const targets = [target, ...(aliases || [])].map(normalizeAnswer);
    for (const t of targets) {
        if (t.length >= 4) {
            const distance = levenshteinDistance(normGuess, t);
            if (distance === 1)
                return true;
        }
    }
    return false;
}
