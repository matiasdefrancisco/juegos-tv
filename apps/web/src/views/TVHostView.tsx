import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameStatus,
  PlayerGuessedPayload,
  SERVER_EVENTS,
  TeamAnsweredPayload
} from '@party-draw/shared';
import { Header } from '../components/common/Header';
import { TVStage, STAGE_SAFE_INSET } from '../components/tv/TVStage';
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

  // ---------------- Sin partida todavía ----------------
  if (!gameState) {
    return (
      <TVStage>
        <div className="w-full h-full flex flex-col items-center justify-center gap-8 text-center px-24">
          {connected ? (
            <>
              <div className="w-24 h-24 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-4xl font-game text-slate-300">
                {waitedTooLong ? 'Creando una sala nueva...' : 'Iniciando pantalla de TV...'}
              </p>
            </>
          ) : (
            <>
              <WifiOff size={96} className="text-rose-400" />
              <p className="text-4xl font-game text-slate-300">Conectando con el servidor...</p>
              <p className="text-slate-500 text-2xl max-w-3xl">
                Si tarda mucho, revisá que el backend esté encendido y accesible desde esta red.
              </p>
            </>
          )}
        </div>
      </TVStage>
    );
  }

  const isAllPlay = gameState.isAllPlayRound;
  const turnTeam = gameState.teams.find((t) => t.id === gameState.currentTeamId);

  return (
    <TVStage>
      {/* Barra superior: alto fijo, forma parte del reparto vertical */}
      <div className="flex-none h-[96px]">
        <Header gameCode={gameCode} connected={connected} isTV />
      </div>

      {/* Zona de contenido: exactamente el alto restante, nunca desborda */}
      <div
        className="relative flex-1 min-h-0 flex flex-col"
        style={{ padding: `${STAGE_SAFE_INSET / 2}px ${STAGE_SAFE_INSET}px ${STAGE_SAFE_INSET}px` }}
      >
        {gameState.status === GameStatus.WAITING && <TVLobby />}

        {gameState.status === GameStatus.COUNTDOWN && (
          <div className="flex-1 flex items-center justify-center">
            <p className="tv-heading text-6xl font-game text-slate-400">Comenzando el turno...</p>
          </div>
        )}

        {gameState.status === GameStatus.DRAWING && (
          <div className="flex-1 min-h-0 flex flex-col gap-5">
            <div className="flex-none">
              <TVHeader />
            </div>
            <div className="flex-1 min-h-0">
              <TVCanvas />
            </div>
          </div>
        )}

        {gameState.status === GameStatus.ROUND_RESULT && <TVRoundResult />}
        {gameState.status === GameStatus.SCOREBOARD && <TVScoreboard />}
        {gameState.status === GameStatus.GAME_OVER && <TVGameOver />}

        {/* Aciertos en vivo */}
        <div className="absolute bottom-10 right-12 z-40 flex flex-col gap-3 pointer-events-none w-[620px] max-w-full overflow-hidden">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`anim-slide-left w-full px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border font-game font-black text-2xl min-w-0 ${
                  toast.kind === 'guess'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                    : 'bg-slate-900 text-white border-slate-600'
                }`}
                style={
                  toast.kind === 'team' && toast.color ? { borderColor: toast.color } : undefined
                }
              >
                {toast.kind === 'guess' ? (
                  <CheckCircle size={28} className="flex-shrink-0" />
                ) : (
                  <Send size={26} className="flex-shrink-0" style={{ color: toast.color }} />
                )}
                <span className="truncate min-w-0 flex-1">{toast.title}</span>
                <span
                  className={`px-3 py-1 rounded-lg text-lg font-mono font-bold flex-shrink-0 ${
                    toast.kind === 'guess'
                      ? 'bg-slate-950 text-emerald-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {toast.detail}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Cuenta regresiva: cubre el escenario entero */}
        {countdown !== null && (
          /* Un solo elemento para toda la cuenta: solo cambia el número de
             adentro. Antes se montaba un overlay por segundo y en una TV lenta
             quedaban apilados tapando la pantalla. */
          <div
            className={`anim-fade absolute inset-0 z-50 flex flex-col items-center justify-center px-24 text-center ${
              isAllPlay ? 'bg-amber-950' : 'bg-slate-950'
            }`}
          >
            {isAllPlay ? (
              <>
                <div className="bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 p-1.5 rounded-3xl shadow-2xl mb-8">
                  <div className="bg-slate-950 px-14 py-6 rounded-[22px] flex items-center gap-5">
                    <Sparkles className="text-amber-400 flex-shrink-0" size={56} />
                    <span className="text-7xl font-black font-game text-gradient-party">
                      ¡JUEGAN TODOS!
                    </span>
                  </div>
                </div>
                <p className="text-4xl font-bold font-game text-amber-200 mb-4 max-w-4xl">
                  Dibuja uno, adivinan todos. ¡El primero que acierte se lleva los puntos!
                </p>
              </>
            ) : (
              <span className="text-5xl leading-tight py-1 font-black font-game text-amber-400 uppercase tracking-widest mb-6">
                {turnTeam ? `Turno de ${turnTeam.name}` : '¡Preparate para dibujar!'}
              </span>
            )}

            {/* tv-heading: Fredoka se sale de su caja en tamaños enormes */}
            <div className="tv-heading text-[13rem] font-game font-black text-gradient-party">
              {countdown}
            </div>
          </div>
        )}
    </TVStage>
  );
};
