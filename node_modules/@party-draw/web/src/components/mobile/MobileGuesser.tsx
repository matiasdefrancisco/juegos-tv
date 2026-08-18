import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useSocket } from '../../context/SocketContext';

export const MobileGuesser: React.FC = () => {
  const { gameState, player, submitGuess, lastGuessFeedback } = useSocket();
  const [guessText, setGuessText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasGuessed = player?.guessedCurrentRound;

  useEffect(() => {
    if (!hasGuessed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [hasGuessed]);

  useEffect(() => {
    if (hasGuessed) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [hasGuessed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessText.trim() || hasGuessed) return;
    submitGuess(guessText.trim());
    setGuessText('');
  };

  if (!gameState) return null;

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 max-w-md mx-auto select-none safe-bottom">
      {/* Top Info Banner */}
      <div className="space-y-3">
        <div className="bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">✏️</span>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dibujante</p>
              <p className="font-game font-bold text-white text-base truncate max-w-[140px]">
                {gameState.currentDrawerName || 'Compañero'}
              </p>
            </div>
          </div>

          {gameState.wordCategory && (
            <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider">
              {gameState.wordCategory}
            </span>
          )}
        </div>

        {/* Word Length Hint */}
        {gameState.wordLength && !hasGuessed && (
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl text-center shadow-inner">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">
              PISTA ({gameState.wordLength} LETRAS)
            </span>
            <div className="flex justify-center items-center space-x-2 font-mono text-2xl tracking-widest text-amber-400 font-black">
              {Array.from({ length: gameState.wordLength }).map((_, i) => (
                <span key={i} className="border-b-3 border-slate-600 px-1">
                  _
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Center Feedback Area */}
      <div className="my-auto py-4">
        <AnimatePresence mode="wait">
          {hasGuessed ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-500/20 border-2 border-emerald-500/60 p-6 rounded-3xl text-center space-y-3 shadow-2xl"
            >
              <CheckCircle2 size={56} className="text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-3xl font-black font-game text-white">¡ADIVINASTE!</h3>
              <p className="text-emerald-300 text-sm font-semibold">
                Sumaste +{player?.currentRoundScore || 0} puntos. Mirá el televisor mientras los demás intentan adivinar.
              </p>
            </motion.div>
          ) : lastGuessFeedback ? (
            <motion.div
              key={lastGuessFeedback.message + Date.now()}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-2xl text-center font-bold text-base border shadow-xl ${
                lastGuessFeedback.isClose
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 animate-pulse'
                  : 'bg-slate-900/90 border-slate-700 text-slate-300'
              }`}
            >
              {lastGuessFeedback.isClose && <AlertCircle className="inline mr-2 text-amber-400" size={20} />}
              <span>{lastGuessFeedback.message}</span>
            </motion.div>
          ) : (
            <div className="text-center text-slate-400 text-sm space-y-3 p-6">
              <Sparkles className="mx-auto text-indigo-400 opacity-70 animate-pulse" size={36} />
              <p className="font-medium text-slate-300">
                Mirá el dibujo en la TV y escribí tu respuesta acá abajo
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Input Area */}
      <form onSubmit={handleSubmit} className="w-full space-y-2">
        <div className="flex items-center space-x-2 relative">
          <input
            ref={inputRef}
            type="text"
            value={guessText}
            onChange={(e) => setGuessText(e.target.value)}
            disabled={hasGuessed}
            placeholder={hasGuessed ? '¡Ya adivinaste esta ronda!' : 'Escribí tu respuesta acá...'}
            className="flex-1 bg-slate-900 border-2 border-slate-700 focus:border-indigo-500 text-white rounded-2xl px-4 py-4 text-lg font-bold outline-none transition-all placeholder:text-slate-500 placeholder:font-normal placeholder:text-base disabled:opacity-50 shadow-lg"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {guessText.length > 0 && !hasGuessed && (
            <button
              type="button"
              onClick={() => setGuessText('')}
              className="absolute right-16 p-2 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="submit"
            disabled={!guessText.trim() || hasGuessed}
            className={`p-4 rounded-2xl transition-all shadow-xl ${
              guessText.trim() && !hasGuessed
                ? 'btn-game-primary cursor-pointer'
                : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Send size={22} />
          </button>
        </div>
      </form>
    </div>
  );
};
