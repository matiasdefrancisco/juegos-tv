import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GameStatus,
  PlayerGuessedPayload,
  SERVER_EVENTS,
  TeamAnsweredPayload
} from '@party-draw/shared';
import { Header } from '../components/common/Header';
import { Screen } from '../components/common/Screen';
import { TVLobby } from '../components/tv/TVLobby';
import { TVHeader } from '../components/tv/TVHeader';
import { TVCanvas } from '../components/tv/TVCanvas';
import { TVRoundResult } from '../components/tv/TVRoundResult';
import { TVScoreboard } from '../components/tv/TVScoreboard';
import { TVGameOver } from '../components/tv/TVGameOver';
import { useSocket } from '../context/SocketContext';
import { CheckCircle, Send, Sparkles, WifiOff } from 'lucide-react';

interface Toast {
  id: string;
  kind: 'guess' | 'team';
  title: string;
  detail: string;
  color?: string;
}

export const TVHostView: React.FC = () => {
  const { gameState, gameCode, connected, countdown, socket, createGame } = useSocket();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  const toastTimersRef = useRef<number[]>([]);

  const pushToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev.slice(-2), toast]);
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4000);
    toastTimersRef.current.push(timer);
  }, []);

  // Si se entró directo a /tv sin sala, se crea una apenas haya conexión
  useEffect(() => {
    if (!connected || gameState) return;

    const timer = window.setTimeout(() => {
      createGame();
      setWaitedTooLong(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [connected, gameState, createGame]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerGuessed = (data: PlayerGuessedPayload) => {
      pushToast({
        id: `guess_${Date.now()}_${Math.random()}`,
        kind: 'guess',
        title: `¡${data.playerName} adivinó!`,
        detail: `+${data.pointsAwarded} pts`
      });
    };

    const handleTeamAnswered = (data: TeamAnsweredPayload) => {
      pushToast({
        id: `team_${Date.now()}_${Math.random()}`,
        kind: 'team',
        title: `${data.teamName} ya respondió`,
        detail: `${data.answeredCount} de ${data.totalTeams}`,
        color: data.teamColor
      });
    };

    socket.on(SERVER_EVENTS.PLAYER_GUESSED, handlePlayerGuessed);
    socket.on(SERVER_EVENTS.TEAM_ANSWERED, handleTeamAnswered);

    return () => {
      socket.off(SERVER_EVENTS.PLAYER_GUESSED, handlePlayerGuessed);
      socket.off(SERVER_EVENTS.TEAM_ANSWERED, handleTeamAnswered);
    };
  }, [socket, pushToast]);

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((t) => window.clearTimeout(t));
      toastTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (gameState?.status !== GameStatus.DRAWING) setToasts([]);
  }, [gameState?.status]);

  // ---------------- Estados sin partida ----------------
  if (!gameState) {
    return (
      <Screen header={<Header connected={connected} isTV />}>
        <div className="min-h-full flex flex-col items-center justify-center gap-5 text-center p-6">
          {connected ? (
            <>
              <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="tv-subtitle font-game text-slate-300">
                {waitedTooLong ? 'Creando una sala nueva...' : 'Iniciando pantalla de TV...'}
              </p>
            </>
          ) : (
            <>
              <WifiOff size={48} className="text-rose-400 animate-pulse" />
              <p className="tv-subtitle font-game text-slate-300">Conectando con el servidor...</p>
              <p className="text-slate-500 text-sm max-w-md">
                Si tarda mucho, revisá que el backend esté encendido y accesible desde esta red.
              </p>
            </>
          )}
        </div>
      </Screen>
    );
  }

  const isAllPlay = gameState.isAllPlayRound;
  const turnTeam = gameState.teams.find((t) => t.id === gameState.currentTeamId);

  return (
    <Screen header={<Header gameCode={gameCode} connected={connected} isTV />}>
      <div className="relative min-h-full flex flex-col">
        {/* Cuenta regresiva (anuncia la carta especial si toca) */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              key={`countdown-${countdown}`}
              initial={{ scale: 1.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className={`fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-lg px-6 text-center ${
                isAllPlay ? 'bg-amber-950/90' : 'bg-slate-950/85'
              }`}
            >
              {isAllPlay ? (
                <>
                  <motion.div
                    initial={{ rotate: -8, scale: 0.85 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                    className="bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 p-1 rounded-3xl shadow-2xl mb-4 max-w-full"
                  >
                    <div className="bg-slate-950 px-6 sm:px-10 py-4 rounded-[20px] flex items-center gap-3">
                      <Sparkles className="text-amber-400 flex-shrink-0" size={32} />
                      <span className="tv-title font-black font-game text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400">
                        ¡JUEGAN TODOS!
                      </span>
                    </div>
                  </motion.div>
                  <p className="text-base sm:text-2xl font-bold font-game text-amber-200 mb-2 max-w-2xl">
                    Dibuja uno, adivinan todos los equipos. ¡El primero que acierte se lleva los
                    puntos!
                  </p>
                </>
              ) : (
                <span className="text-xl sm:text-3xl font-black font-game text-amber-400 uppercase tracking-widest mb-3">
                  {turnTeam ? `TURNO DE ${turnTeam.name.toUpperCase()}` : '¡PREPARATE PARA DIBUJAR!'}
                </span>
              )}

              <div className="tv-countdown font-game font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400">
                {countdown}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {gameState.status === GameStatus.WAITING && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
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
              className="flex-1 flex flex-col items-center justify-center gap-4 p-8 min-h-[50vh]"
            >
              <p className="tv-title font-game text-slate-400 animate-pulse text-center">
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
              className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-3 px-4 sm:px-6 py-4"
            >
              <TVHeader />
              {/* El lienzo crece con la pantalla pero nunca colapsa */}
              <div className="flex-1 min-h-[clamp(240px,48vh,720px)] w-full">
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
              className="flex-1 flex flex-col"
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
              className="flex-1 flex flex-col"
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
              className="flex-1 flex flex-col"
            >
              <TVGameOver />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avisos en vivo */}
        <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 pointer-events-none max-w-[min(92vw,26rem)]">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                layout
                initial={{ x: 80, opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 80, opacity: 0 }}
                className={`px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border font-game font-black text-sm sm:text-base ${
                  toast.kind === 'guess'
                    ? 'bg-emerald-500/95 text-slate-950 border-emerald-300/60'
                    : 'bg-slate-900/95 text-white border-slate-600'
                }`}
                style={
                  toast.kind === 'team' && toast.color
                    ? { borderColor: toast.color }
                    : undefined
                }
              >
                {toast.kind === 'guess' ? (
                  <CheckCircle size={20} className="flex-shrink-0" />
                ) : (
                  <Send size={18} className="flex-shrink-0" style={{ color: toast.color }} />
                )}
                <span className="truncate">{toast.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold flex-shrink-0 ${
                    toast.kind === 'guess'
                      ? 'bg-slate-950 text-emerald-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {toast.detail}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Screen>
  );
};
