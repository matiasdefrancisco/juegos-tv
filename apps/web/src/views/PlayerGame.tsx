import React from 'react';
import { GameMode, GameStatus, getCategoryLabel } from '@party-draw/shared';
import { Trophy } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Screen } from '../components/common/Screen';
import { MobileLobby } from '../components/mobile/MobileLobby';
import { MobileCanvas } from '../components/mobile/MobileCanvas';
import { MobileGuesser } from '../components/mobile/MobileGuesser';
import { MobileResults } from '../components/mobile/MobileResults';
import { useSocket } from '../context/SocketContext';

export const PlayerGame: React.FC = () => {
  const { gameState, player, team, gameCode, connected, secretWord, countdown, isHost, playAgain } =
    useSocket();

  if (!gameState || !player) {
    return (
      <Screen header={<Header connected={connected} />}>
        <div className="min-h-full flex flex-col items-center justify-center p-6 gap-4 text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg font-game text-slate-300">Conectando con la partida...</p>
        </div>
      </Screen>
    );
  }

  const isDrawer = gameState.currentDrawerId === player.id;
  const isDrawing = gameState.status === GameStatus.DRAWING;

  // En equipos, avisar si el turno es del jugador o le toca observar
  const isTeamMode = gameState.settings.mode === GameMode.TEAMS;
  const myTurn = !isTeamMode || player.teamId === gameState.currentTeamId;
  const myTurnLabel = !isTeamMode
    ? '¡PREPARATE PARA ADIVINAR!'
    : myTurn
    ? '¡ES EL TURNO DE TU EQUIPO!'
    : 'TU EQUIPO OBSERVA ESTA RONDA';

  // Solo el lienzo del dibujante bloquea el scroll: necesita alto fijo.
  const lockScroll = isDrawing && isDrawer;

  return (
    <Screen
      scrollable={!lockScroll}
      header={
        <Header
          title={player.name}
          gameCode={gameCode}
          connected={connected}
          teamName={team?.name}
          teamColor={team?.color}
        />
      }
    >
      <div className={lockScroll ? 'h-full flex flex-col' : 'min-h-full flex flex-col'}>
        {/* Cuenta regresiva */}
          {countdown !== null && (
            <div
              className="anim-fade fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-center p-6"
            >
              {gameState.isAllPlayRound && !isDrawer && (
                <span className="bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black text-sm px-4 py-1.5 rounded-full mb-3">
                  ✨ ¡JUEGAN TODOS!
                </span>
              )}
              <span className="text-base sm:text-lg font-bold font-game text-amber-400 uppercase tracking-wider mb-2 px-4">
                {isDrawer
                  ? '¡ES TU TURNO DE DIBUJAR!'
                  : gameState.isAllPlayRound
                  ? 'ADIVINAN TODOS: ¡EL PRIMERO GANA!'
                  : myTurnLabel}
              </span>
              <div className="font-game font-black text-7xl sm:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400">
                {countdown}
              </div>
            </div>
          )}
          {gameState.status === GameStatus.WAITING && (
            <div
              className="anim-fade flex-1 flex flex-col"
            >
              <MobileLobby />
            </div>
          )}

          {gameState.status === GameStatus.COUNTDOWN && (
            <div
              className="anim-fade flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center min-h-[50vh]"
            >
              <span className="text-4xl animate-bounce" aria-hidden="true">
                ⏳
              </span>
              <p className="text-lg sm:text-xl font-game text-slate-300 px-4">
                {isDrawer
                  ? '¡Preparate! Te toca dibujar.'
                  : gameState.isAllPlayRound
                  ? '¡Ronda abierta! Adivinan todos los equipos.'
                  : myTurn
                  ? '¡Atento! Le toca adivinar a tu equipo.'
                  : 'Tu equipo observa esta ronda.'}
              </p>
            </div>
          )}

          {isDrawing && (
            <div
              className="anim-fade flex-1 flex flex-col min-h-0"
            >
              {isDrawer ? (
                <MobileCanvas
                  wordText={secretWord?.text || 'Cargando palabra...'}
                  category={getCategoryLabel(secretWord?.category || gameState.wordCategory)}
                />
              ) : (
                <MobileGuesser />
              )}
            </div>
          )}

          {(gameState.status === GameStatus.ROUND_RESULT ||
            gameState.status === GameStatus.SCOREBOARD) && (
            <div
              className="anim-fade flex-1 flex flex-col"
            >
              <MobileResults />
            </div>
          )}

          {gameState.status === GameStatus.GAME_OVER && (
            <div
              className="anim-pop flex-1 flex flex-col gap-4 p-5 max-w-md mx-auto w-full text-center justify-center safe-bottom"
            >
              <div className="space-y-2">
                <Trophy size={48} className="text-amber-400 mx-auto animate-bounce" />
                <h3 className="text-2xl sm:text-3xl font-black font-game text-white">
                  ¡FIN DEL JUEGO!
                </h3>
              </div>

              <div className="panel p-5 space-y-2.5">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                  {team ? `Puntaje de ${team.name}` : 'Tu puntuación final'}
                </span>
                <p className="font-mono text-4xl sm:text-5xl font-black text-amber-400">
                  {team ? team.score : player.score} pts
                </p>
                {team && (
                  <p className="text-slate-400 text-xs">Tu aporte individual: {player.score} pts</p>
                )}
                <p className="text-slate-300 text-sm font-medium">
                  Mirá el televisor para ver el podio completo.
                </p>
              </div>

              {isHost ? (
                <button
                  onClick={playAgain}
                  className="btn-game-yellow w-full py-4 text-lg font-bold font-game"
                >
                  JUGAR OTRA VEZ
                </button>
              ) : (
                <div className="panel-soft py-3.5 px-4 text-slate-400 text-xs font-semibold">
                  Esperando a que el anfitrión inicie otra partida...
                </div>
              )}
            </div>
          )}
      </div>
    </Screen>
  );
};
