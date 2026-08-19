import { CATEGORY_IDS, getDifficultyMeta, INITIAL_WORD_BANK, isAnswerCorrect, isGuessClose } from '@party-draw/shared';
export class WordService {
    words = [...INITIAL_WORD_BANK];
    /**
     * Elige una palabra respetando SIEMPRE las categorías seleccionadas.
     *
     * El orden de relajación es intencional: primero se afloja la dificultad y
     * después se reciclan palabras ya usadas, pero nunca se sale de las categorías
     * elegidas. (Antes, al agotarse el pool se caía al banco completo y por eso
     * aparecían palabras que no correspondían con la categoría en pantalla.)
     */
    getRandomWord(categories, difficulty, usedWordIds) {
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
            if (pool.length > 0)
                return { word: pickRandom(pool), recycled: false };
        }
        // 2) Cualquier nivel dentro de las categorías, sin repetir
        const anyLevel = inCategory.filter((w) => !usedWordIds.has(w.id));
        if (anyLevel.length > 0)
            return { word: pickRandom(anyLevel), recycled: false };
        // 3) Todo usado: se recicla, priorizando el nivel pedido
        for (const level of preferredLevels) {
            const pool = inCategory.filter((w) => w.difficulty === level);
            if (pool.length > 0)
                return { word: pickRandom(pool), recycled: true };
        }
        return { word: pickRandom(inCategory), recycled: true };
    }
    /** Descarta categorías inválidas y evita quedarse sin ninguna */
    resolveCategories(categories) {
        const valid = (categories || []).filter((c) => CATEGORY_IDS.includes(c));
        return valid.length > 0 ? valid : [...CATEGORY_IDS];
    }
    /** Cuántas palabras hay disponibles para una configuración dada */
    countAvailable(categories, difficulty) {
        const activeCategories = this.resolveCategories(categories);
        const levels = getDifficultyMeta(difficulty).levels;
        return this.words.filter((w) => activeCategories.includes(w.category) && levels.includes(w.difficulty)).length;
    }
    isCorrectGuess(guess, word) {
        return isAnswerCorrect(guess, word);
    }
    isCloseGuess(guess, word) {
        return isGuessClose(guess, word);
    }
    /** Palabras extra (mazos personalizados, Firestore, etc.) */
    addCustomWords(customWords) {
        const existingIds = new Set(this.words.map((w) => w.id));
        for (const word of customWords) {
            if (!existingIds.has(word.id)) {
                this.words.push(word);
                existingIds.add(word.id);
            }
        }
    }
    getLevelBreakdown(categories) {
        const activeCategories = this.resolveCategories(categories);
        const breakdown = { 1: 0, 2: 0, 3: 0 };
        for (const word of this.words) {
            if (activeCategories.includes(word.category))
                breakdown[word.difficulty]++;
        }
        return breakdown;
    }
}
function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}
