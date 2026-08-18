import { INITIAL_WORD_BANK, normalizeAnswer, isGuessClose } from '@party-draw/shared';
export class WordService {
    words = [...INITIAL_WORD_BANK];
    /**
     * Returns a random word from the available categories that hasn't been used yet in the game
     */
    getRandomWord(categories, usedWordIds) {
        const pool = this.words.filter((w) => (categories.length === 0 || categories.includes(w.category)) && !usedWordIds.has(w.id));
        const selectionPool = pool.length > 0 ? pool : this.words; // Fallback if all words used
        const randomIndex = Math.floor(Math.random() * selectionPool.length);
        return selectionPool[randomIndex];
    }
    /**
     * Checks if a guess matches the target word or its aliases
     */
    isCorrectGuess(guess, word) {
        const normalizedGuess = normalizeAnswer(guess);
        if (!normalizedGuess)
            return false;
        const normalizedTarget = normalizeAnswer(word.text);
        if (normalizedGuess === normalizedTarget)
            return true;
        if (word.aliases && word.aliases.length > 0) {
            return word.aliases.some((alias) => normalizeAnswer(alias) === normalizedGuess);
        }
        return false;
    }
    /**
     * Checks if a guess was close (for friendly player hint)
     */
    isCloseGuess(guess, word) {
        return isGuessClose(guess, word.text, word.aliases);
    }
    /**
     * Adds custom words (e.g. from Firestore or custom room settings)
     */
    addCustomWords(customWords) {
        this.words.push(...customWords);
    }
}
