import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameStatus, PlayerGuessedPayload, SERVER_EVENTS } from '@party-draw/shared';
import { Header } from '../components/common/Header';
import { TVLobby } from '../components/tv/TVLobby';
import { TVHeader } from '../components/tv/TVHeader';
import { TVCanvas } from '../components/tv/TVCanvas';
import { TVRoundResult } from '../components/tv/TVRoundResult';
import { TVScoreboard } from '../components/tv/TVScoreboard';
import { TVGameOver } from '../components/tv/TVGameOver';
import { useSocket } from '../context/SocketContext';
import { Sparkles, CheckCircle } from 'lucide-react';

interface GuessToast {
  id: string;
  playerName: string;
  points: number;
}

export const TVHostView: React.FC = () => {
  const { gameState, gameCode, connected, countdown, socket } = useSocket();
  const [toasts, setToasts] = useState<GuessToast[]>([]);

  // Listen to live correct guesses to show floating party banners on TV
  useEffect(() => {
    if (!socket) return;

    const handlePlayerGuessed = (data: PlayerGuessedPayload) => {
      const newToast: GuessToast = {
        id: `toast_${Date.now()}_${Math.random()}`,
        playerName: data.playerName,
        points: data.pointsAwarded
      };

      setToasts((prev) => [...prev.slice(-3), newToast]);

      // Remove toast after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    socket.on(SERVER_EVENTS.PLAYER_GUESSED, handlePlayerGuessed);
    return () => {
      socket.off(SERVER_EVENTS.PLAYER_GUESSED, handlePlayerGuessed);
    };
  }, [socket]);

  // Clear toasts when status changes
  useEffect(() => {
    if (gameState?.status !== GameStatus.DRAWING) {
      setToasts([]);
    }
  }, [gameState?.status]);

  if (!gameState) {
    return (
      <div className="min-h-screen party-bg-ambient flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-2xl font-game text-slate-300">Iniciando pantalla de TV...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen party-bg-ambient text-white flex flex-col justify-between overflow-hidden select-none relative">
      {/* TV Header */}
      <Header gameCode={gameCode} connected={connected} isTV={true} />

      {/* Main Stage View */}
      <main className="flex-1 flex items-center justify-center p-6 relative w-full overflow-hidden">
        {/* Countdown Overlay (3, 2, 1) */}
        {countdown !== null && (
          <motion.div
            key={countdown}
            initial={{ scale: 2.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-lg"
          >
            <span className="text-3xl font-black font-game text-amber-400 uppercase tracking-widest mb-4">
              ¡PREPARATE PARA DIBUJAR!
            </span>
            <div className="font-game font-black text-[12rem] md:text-[16rem] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400 drop-shadow-2xl">
              {countdown}
            </div>
          </motion.div>
        )}

        {/* Dynamic Screen based on game state */}
        <AnimatePresence mode="wait">
          {gameState.status === GameStatus.WAITING && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <TVLobby />
            </motion.div>
          )}

          {gameState.status === GameStatus.COUNTDOWN && (
            <motion.div
              key="countdown-placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center space-y-4"
            >
              <p className="text-4xl font-game text-slate-400 animate-pulse">
                Comenzando el turno...
              </p>
            </motion.div>
          )}

          {gameState.status === GameStatus.DRAWING && (
            <motion.div
              key="drawing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full max-w-6xl mx-auto flex flex-col justify-between space-y-4 pb-2"
            >
              <TVHeader />
              <div className="flex-1 w-full min-h-[460px] my-auto">
                <TVCanvas />
              </div>
            </motion.div>
          )}

          {gameState.status === GameStatus.ROUND_RESULT && (
            <motion.div
              key="round_result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <TVRoundResult />
            </motion.div>
          )}

          {gameState.status === GameStatus.SCOREBOARD && (
            <motion.div
              key="scoreboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <TVScoreboard />
            </motion.div>
          )}

          {gameState.status === GameStatus.GAME_OVER && (
            <motion.div
              key="game_over"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <TVGameOver />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Guesser Toasts on TV Bottom-Right */}
        <div className="absolute bottom-6 right-6 z-40 flex flex-col space-y-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ x: 100, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className="bg-emerald-500/90 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-emerald-300/60 font-game font-black text-xl"
              >
                <CheckCircle size={24} className="text-slate-950 flex-shrink-0" />
                <span>🎉 ¡{toast.playerName} adivinó!</span>
                <span className="bg-slate-950 text-emerald-400 px-2 py-0.5 rounded-lg text-sm font-mono font-bold">
                  +{toast.points} pts
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
