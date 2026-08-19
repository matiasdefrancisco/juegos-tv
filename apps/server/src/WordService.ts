import {
  CATEGORY_IDS,
  Difficulty,
  getDifficultyMeta,
  INITIAL_WORD_BANK,
  isAnswerCorrect,
  isGuessClose,
  Word,
  WordLevel
} from '@party-draw/shared';

export interface WordPick {
  word: Word;
  /** true si hubo que reciclar palabras ya usadas para poder seguir jugando */
  recycled: boolean;
}

export class WordService {
  private words: Word[] = [...INITIAL_WORD_BANK];

  /**
   * Elige una palabra respetando SIEMPRE las categorías seleccionadas.
   *
   * El orden de relajación es intencional: primero se afloja la dificultad y
   * después se reciclan palabras ya usadas, pero nunca se sale de las categorías
   * elegidas. (Antes, al agotarse el pool se caía al banco completo y por eso
   * aparecían palabras que no correspondían con la categoría en pantalla.)
   */
  public getRandomWord(
    categories: string[],
    difficulty: Difficulty,
    usedWordIds: Set<string>
  ): WordPick {
    const activeCategories = this.resolveCategories(categories);
    const inCategory = this.words.filter((w) => activeCategories.includes(w.category));

    // Por si una categoría quedara sin palabras cargadas
    if (inCategory.length === 0) {
      const fallback = this.words[Math.floor(Math.random() * this.words.length)];
      return { word: fallback, recycled: true };
    }

    const preferredLevels = getDifficultyMeta(difficulty).levels;

    // 1) Nivel preferido, sin repetir
    for (const level of preferredLevels) {
      const pool = inCategory.filter((w) => w.difficulty === level && !usedWordIds.has(w.id));
      if (pool.length > 0) return { word: pickRandom(pool), recycled: false };
    }

    // 2) Cualquier nivel dentro de las categorías, sin repetir
    const anyLevel = inCategory.filter((w) => !usedWordIds.has(w.id));
    if (anyLevel.length > 0) return { word: pickRandom(anyLevel), recycled: false };

    // 3) Todo usado: se recicla, priorizando el nivel pedido
    for (const level of preferredLevels) {
      const pool = inCategory.filter((w) => w.difficulty === level);
      if (pool.length > 0) return { word: pickRandom(pool), recycled: true };
    }

    return { word: pickRandom(inCategory), recycled: true };
  }

  /** Descarta categorías inválidas y evita quedarse sin ninguna */
  private resolveCategories(categories: string[]): string[] {
    const valid = (categories || []).filter((c) => CATEGORY_IDS.includes(c));
    return valid.length > 0 ? valid : [...CATEGORY_IDS];
  }

  /** Cuántas palabras hay disponibles para una configuración dada */
  public countAvailable(categories: string[], difficulty: Difficulty): number {
    const activeCategories = this.resolveCategories(categories);
    const levels = getDifficultyMeta(difficulty).levels;
    return this.words.filter(
      (w) => activeCategories.includes(w.category) && levels.includes(w.difficulty)
    ).length;
  }

  public isCorrectGuess(guess: string, word: Word): boolean {
    return isAnswerCorrect(guess, word);
  }

  public isCloseGuess(guess: string, word: Word): boolean {
    return isGuessClose(guess, word);
  }

  /** Palabras extra (mazos personalizados, Firestore, etc.) */
  public addCustomWords(customWords: Word[]): void {
    const existingIds = new Set(this.words.map((w) => w.id));
    for (const word of customWords) {
      if (!existingIds.has(word.id)) {
        this.words.push(word);
        existingIds.add(word.id);
      }
    }
  }

  public getLevelBreakdown(categories: string[]): Record<WordLevel, number> {
    const activeCategories = this.resolveCategories(categories);
    const breakdown: Record<WordLevel, number> = { 1: 0, 2: 0, 3: 0 };
    for (const word of this.words) {
      if (activeCategories.includes(word.category)) breakdown[word.difficulty]++;
    }
    return breakdown;
  }
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
