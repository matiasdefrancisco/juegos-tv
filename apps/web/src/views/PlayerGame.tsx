import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameStatus } from '@party-draw/shared';
import { Header } from '../components/common/Header';
import { MobileLobby } from '../components/mobile/MobileLobby';
import { MobileCanvas } from '../components/mobile/MobileCanvas';
import { MobileGuesser } from '../components/mobile/MobileGuesser';
import { MobileResults } from '../components/mobile/MobileResults';
import { useSocket } from '../context/SocketContext';
import { Crown, Trophy } from 'lucide-react';

export const PlayerGame: React.FC = () => {
  const { gameState, player, gameCode, connected, secretWord, countdown } = useSocket();

  if (!gameState || !player) {
    return (
      <div className="h-[100dvh] party-bg-ambient flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-game text-slate-300">Conectando con la partida...</p>
      </div>
    );
  }

  const isDrawer = gameState.currentDrawerId === player.id;

  return (
    <div className="h-[100dvh] max-h-[100dvh] party-bg-ambient text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Mobile Game Header */}
      <Header
        title={player.name}
        gameCode={gameCode}
        connected={connected}
      />

      {/* Main Controller Stage */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full overflow-hidden">
        {/* Countdown Overlay */}
        {countdown !== null && (
          <motion.div
            key={countdown}
            initial={{ scale: 1.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md text-center p-6"
          >
            <span className="text-base sm:text-lg font-bold font-game text-amber-400 uppercase tracking-wider mb-2">
              {isDrawer ? '¡ES TU TURNO DE DIBUJAR!' : '¡PREPARATE PARA ADIVINAR!'}
            </span>
            <div className="font-game font-black text-8xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400">
              {countdown}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {gameState.status === GameStatus.WAITING && (
            <motion.div
              key="mobile-waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <MobileLobby />
            </motion.div>
          )}

          {gameState.status === GameStatus.COUNTDOWN && (
            <motion.div
              key="mobile-countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center space-y-3 p-6 text-center"
            >
              <span className="text-4xl animate-bounce">⏳</span>
              <p className="text-xl font-game text-slate-300">
                {isDrawer ? '¡Preparate! Te toca dibujar.' : '¡Atento a la TV! Alguien va a dibujar.'}
              </p>
            </motion.div>
          )}

          {gameState.status === GameStatus.DRAWING && (
            <motion.div
              key="mobile-drawing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {isDrawer ? (
                <MobileCanvas
                  wordText={secretWord?.text || 'Dibujá...'}
                  category={secretWord?.category || gameState.wordCategory || 'General'}
                />
              ) : (
                <MobileGuesser />
              )}
            </motion.div>
          )}

          {(gameState.status === GameStatus.ROUND_RESULT || gameState.status === GameStatus.SCOREBOARD) && (
            <motion.div
              key="mobile-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <MobileResults />
            </motion.div>
          )}

          {gameState.status === GameStatus.GAME_OVER && (
            <motion.div
              key="mobile-game-over"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col justify-between p-6 max-w-md mx-auto text-center my-auto safe-bottom"
            >
              <div className="space-y-2">
                <Trophy size={54} className="text-amber-400 mx-auto animate-bounce" />
                <h3 className="text-3xl font-black font-game text-white">¡FIN DEL JUEGO!</h3>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-3xl space-y-3 my-auto shadow-2xl">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  Tu puntuación final
                </span>
                <p className="font-mono text-5xl font-black text-amber-400">{player.score} pts</p>
                <p className="text-slate-300 text-sm font-medium">
                  Mirá el televisor para ver el podio de campeones.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 py-3.5 px-4 rounded-2xl text-slate-400 text-xs font-semibold">
                Esperando a que el anfitrión inicie otra partida...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
