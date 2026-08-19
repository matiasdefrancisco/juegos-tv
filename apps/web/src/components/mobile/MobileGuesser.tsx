import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Dices,
  Eye,
  Send,
  Sparkles,
  Target,
  Timer,
  X
} from 'lucide-react';
import { celebrateGuess } from '../../utils/celebrate';
import { GameMode, getCategoryLabel, RoundMode } from '@party-draw/shared';
import { useSocket } from '../../context/SocketContext';

export const MobileGuesser: React.FC = () => {
  const { gameState, player, team, submitGuess, lastGuessFeedback } = useSocket();
  const [guessText, setGuessText] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const roundEndsAt = gameState?.roundEndsAt ?? null;
  const isTeamMode = gameState?.settings.mode === GameMode.TEAMS;
  const isRiskMode = !isTeamMode && gameState?.settings.roundMode === RoundMode.RISK;
  const isAllPlay = !!gameState?.isAllPlayRound;

  const hasGuessed = !!player?.guessedCurrentRound;

  // En equipos solo juega el equipo en turno, salvo carta abierta
  const isMyTurn = !isTeamMode || isAllPlay || player?.teamId === gameState?.currentTeamId;
  const observing = !isMyTurn;

  const attemptsLeft = gameState?.attemptsLeft ?? null;
  const teamClosed = isTeamMode && !isAllPlay && !!team?.hasAnswered;
  const noAttempts = attemptsLeft === 0;
  const alreadyAnswered = hasGuessed || (isRiskMode && !!player?.hasAnswered);

  const locked = observing || alreadyAnswered || teamClosed || noAttempts;

  useEffect(() => {
    if (!roundEndsAt) return;
    const tick = () => setTimeLeft(Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000)));
    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [roundEndsAt]);

  useEffect(() => {
    if (!locked && inputRef.current) inputRef.current.focus();
  }, [locked]);

  useEffect(() => {
    if (!hasGuessed) return;
    celebrateGuess();
  }, [hasGuessed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = guessText.trim();
    if (!text || locked) return;
    submitGuess(text);
    setGuessText('');
    if (!isRiskMode && attemptsLeft !== 1) inputRef.current?.focus();
  };

  if (!gameState) return null;

  const isLowTime = timeLeft > 0 && timeLeft <= 10;
  const pattern = gameState.wordPattern || [];
  const totalLetters = pattern.reduce((sum, n) => sum + n, 0);
  const turnTeam = gameState.teams.find((t) => t.id === gameState.currentTeamId);

  const placeholder = observing
    ? 'Le toca al otro equipo'
    : alreadyAnswered
    ? 'Ya respondiste'
    : teamClosed || noAttempts
    ? 'Tu equipo cerró el turno'
    : isRiskMode || attemptsLeft === 1
    ? 'Un solo intento: escribí con cuidado'
    : 'Escribí tu respuesta acá...';

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 flex flex-col gap-3 min-h-full safe-bottom">
      {/* Cabecera */}
      <div className="space-y-2.5 flex-shrink-0">
        <div className="panel p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0" aria-hidden="true">
              ✏️
            </span>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Dibujante
              </p>
              <p className="font-game font-bold text-white text-sm truncate max-w-[7rem]">
                {gameState.currentDrawerName || 'Compañero'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {gameState.wordCategory && (
              <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold px-2 py-1.5 rounded-lg uppercase tracking-wider max-w-[5.5rem] truncate">
                {getCategoryLabel(gameState.wordCategory)}
              </span>
            )}
            <span
              className={`flex items-center gap-1 font-mono font-black text-sm px-2 py-1.5 rounded-lg border ${
                isLowTime
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <Timer size={13} />
              <span>{timeLeft}</span>
            </span>
          </div>
        </div>

        {/* Estado del turno */}
        <div className="flex items-center gap-2 text-[11px] flex-wrap">
          {isAllPlay && (
            <span className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 px-2 py-1 rounded-lg font-black">
              <Sparkles size={12} />
              <span>¡JUEGAN TODOS!</span>
            </span>
          )}

          {isTeamMode && !isAllPlay && turnTeam && (
            <span
              className="px-2 py-1 rounded-lg font-bold text-white truncate max-w-[10rem]"
              style={{ backgroundColor: turnTeam.color }}
            >
              {turnTeam.emoji} Turno de {turnTeam.name}
            </span>
          )}

          {isRiskMode && (
            <span className="flex items-center gap-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2 py-1 rounded-lg font-bold">
              <Dices size={12} />
              <span>Riesgo</span>
            </span>
          )}

          {isTeamMode && !isAllPlay && isMyTurn && attemptsLeft != null && (
            <span
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold border ${
                attemptsLeft <= 1
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-300'
                  : 'panel-soft text-slate-300'
              }`}
            >
              <Target size={12} />
              <span>
                {attemptsLeft} {attemptsLeft === 1 ? 'intento' : 'intentos'}
              </span>
            </span>
          )}
        </div>

        {/* Pista: una fila de guiones por palabra */}
        {pattern.length > 0 && !hasGuessed && !observing && (
          <div className="panel-soft p-2.5 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1.5">
              Pista · {pattern.length === 1 ? `${totalLetters} letras` : `${pattern.length} palabras`}
            </span>
            <div className="flex flex-wrap justify-center items-end gap-x-3 gap-y-2">
              {pattern.map((length, wordIndex) => (
                <span key={wordIndex} className="flex gap-1">
                  {Array.from({ length }).map((_, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-4 border-b-2 border-slate-600"
                      aria-hidden="true"
                    />
                  ))}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Devolución */}
      <div className="flex-1 flex items-center justify-center py-2 min-h-[120px]">
          {hasGuessed ? (
            <div
              className="anim-pop bg-emerald-500/20 border-2 border-emerald-500/60 p-5 rounded-3xl text-center space-y-2.5 shadow-2xl w-full"
            >
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-2xl font-black font-game text-white">¡ADIVINASTE!</h3>
              <p className="text-emerald-300 text-sm font-semibold">
                {team ? `${team.name} suma ` : 'Sumaste '}+{player?.currentRoundScore || 0} puntos.
              </p>
            </div>
          ) : observing ? (
            <div
              className="anim-pop panel-soft p-5 rounded-3xl text-center space-y-2.5 w-full"
            >
              <Eye size={40} className="text-slate-400 mx-auto" />
              <h3 className="text-lg font-black font-game text-white">Estás observando</h3>
              <p className="text-slate-400 text-sm font-medium">
                {turnTeam ? (
                  <>
                    Es el turno de{' '}
                    <span style={{ color: turnTeam.color }} className="font-bold">
                      {turnTeam.name}
                    </span>
                    . Mirá la TV y preparate para el tuyo.
                  </>
                ) : (
                  'Mirá la TV: en un rato te toca a vos.'
                )}
              </p>
            </div>
          ) : teamClosed || noAttempts ? (
            <div
              className="anim-pop bg-slate-900/90 border-2 border-slate-700 p-5 rounded-3xl text-center space-y-2.5 w-full"
            >
              <Target size={38} className="text-slate-400 mx-auto" />
              <h3 className="text-lg font-black font-game text-white">Turno cerrado</h3>
              <p className="text-slate-400 text-sm font-medium">
                Tu equipo usó todos sus intentos. Esperá el resultado en la TV.
              </p>
            </div>
          ) : alreadyAnswered ? (
            <div
              className="anim-pop bg-purple-500/15 border-2 border-purple-500/50 p-5 rounded-3xl text-center space-y-2.5 w-full"
            >
              <Dices size={40} className="text-purple-300 mx-auto animate-pulse" />
              <h3 className="text-xl font-black font-game text-white">¡Respuesta enviada!</h3>
              <p className="text-purple-200 text-sm font-medium">
                Se revela cuando respondan todos. Mirá la TV.
              </p>
            </div>
          ) : lastGuessFeedback ? (
            <div
              key={`fb-${lastGuessFeedback.message}-${lastGuessFeedback.isClose}`}
              className={`anim-slide-up p-4 rounded-2xl text-center font-bold text-sm border shadow-xl w-full ${
                lastGuessFeedback.throttled
                  ? 'bg-slate-900/90 border-slate-700 text-slate-400'
                  : lastGuessFeedback.isClose
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                  : 'bg-slate-900/90 border-slate-700 text-slate-300'
              }`}
            >
              {lastGuessFeedback.isClose && !lastGuessFeedback.throttled && (
                <AlertCircle className="inline mr-2 text-amber-400" size={18} />
              )}
              <span>{lastGuessFeedback.message}</span>
            </div>
          ) : (
            <div
              className="anim-fade text-center text-slate-400 text-sm space-y-2.5 px-4"
            >
              <Sparkles className="mx-auto text-indigo-400 opacity-70 animate-pulse" size={32} />
              <p className="font-medium text-slate-300">
                {isAllPlay
                  ? '¡Ronda abierta! El primero que acierte se lleva los puntos'
                  : 'Mirá el dibujo en la TV y escribí tu respuesta'}
              </p>
              {(isRiskMode || attemptsLeft === 1) && (
                <p className="text-purple-300 text-xs font-semibold">
                  Ojo: tenés un solo intento
                </p>
              )}
            </div>
          )}
      </div>

      {/* Entrada */}
      <form onSubmit={handleSubmit} className="w-full flex-shrink-0">
        <label htmlFor="guess-input" className="sr-only">
          Tu respuesta
        </label>
        <div className="flex items-center gap-2 relative">
          <input
            id="guess-input"
            ref={inputRef}
            type="text"
            value={guessText}
            onChange={(e) => setGuessText(e.target.value)}
            disabled={locked}
            maxLength={60}
            placeholder={placeholder}
            className="flex-1 min-w-0 bg-slate-900 border-2 border-slate-700 focus:border-indigo-500 text-white rounded-2xl px-4 py-3.5 text-base font-bold outline-none transition-all placeholder:text-slate-500 placeholder:font-normal placeholder:text-sm disabled:opacity-50 shadow-lg"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="send"
          />

          {guessText.length > 0 && !locked && (
            <button
              type="button"
              onClick={() => setGuessText('')}
              aria-label="Borrar texto"
              className="absolute right-[4.25rem] p-2 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}

          <button
            type="submit"
            disabled={!guessText.trim() || locked}
            aria-label="Enviar respuesta"
            className={`p-3.5 rounded-2xl transition-all shadow-xl flex-shrink-0 ${
              guessText.trim() && !locked ? 'btn-game-primary' : 'btn-disabled'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};
