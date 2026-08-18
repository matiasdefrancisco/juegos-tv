/**
 * Normalizes an answer string by:
 * 1. Converting to lowercase
 * 2. Removing diacritics/accents (e.g. Pingüino -> pinguino, Avión -> avion)
 * 3. Removing punctuation and special characters
 * 4. Collapsing multiple spaces into one
 */
export declare function normalizeAnswer(text: string): string;
/**
 * Sanitizes a player's name (length 2-15, remove harmful HTML characters)
 */
export declare function sanitizePlayerName(rawName: string): string;
export declare function generateRoomCode(): string;
/**
 * Calculates Levenshtein distance between two strings
 */
export declare function levenshteinDistance(a: string, b: string): number;
/**
 * Checks if a guess is very close to the target or any aliases (1 character diff for words >= 4 letters)
 */
export declare function isGuessClose(guess: string, target: string, aliases?: string[]): boolean;
//# sourceMappingURL=utils.d.ts.map