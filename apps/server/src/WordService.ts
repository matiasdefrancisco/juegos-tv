import { INITIAL_WORD_BANK, Word, normalizeAnswer, isGuessClose } from '@party-draw/shared';

export class WordService {
  private words: Word[] = [...INITIAL_WORD_BANK];

  /**
   * Returns a random word from the available categories that hasn't been used yet in the game
   */
  public getRandomWord(categories: string[], usedWordIds: Set<string>): Word {
    const pool = this.words.filter(
      (w) => (categories.length === 0 || categories.includes(w.category)) && !usedWordIds.has(w.id)
    );

    const selectionPool = pool.length > 0 ? pool : this.words; // Fallback if all words used
    const randomIndex = Math.floor(Math.random() * selectionPool.length);
    return selectionPool[randomIndex];
  }

  /**
   * Checks if a guess matches the target word or its aliases
   */
  public isCorrectGuess(guess: string, word: Word): boolean {
    const normalizedGuess = normalizeAnswer(guess);
    if (!normalizedGuess) return false;

    const normalizedTarget = normalizeAnswer(word.text);
    if (normalizedGuess === normalizedTarget) return true;

    if (word.aliases && word.aliases.length > 0) {
      return word.aliases.some((alias: string) => normalizeAnswer(alias) === normalizedGuess);
    }

    return false;
  }

  /**
   * Checks if a guess was close (for friendly player hint)
   */
  public isCloseGuess(guess: string, word: Word): boolean {
    return isGuessClose(guess, word.text, word.aliases);
  }

  /**
   * Adds custom words (e.g. from Firestore or custom room settings)
   */
  public addCustomWords(customWords: Word[]): void {
    this.words.push(...customWords);
  }
}
