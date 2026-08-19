import React from 'react';
import { getCategoryLabel } from '@party-draw/shared';
import { CheckCircle2, UserCheck, XCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { usePhaseCountdown } from '../../utils/usePhaseCountdown';
import { TVCanvas } from './TVCanvas';

/** Cuántas respuestas entran sin scroll, según el alto disponible */
const MAX_VISIBLE_ANSWERS = 7;

export const TVRoundResult: React.FC = () => {
  const { gameState } = useSocket();
  const { percent } = usePhaseCountdown(gameState?.phaseEndsAt);
  const result = gameState?.lastRoundResult;

  if (!result) return null;

  const answers = result.teamAnswers ?? [];
  const hasAnswerLog = answers.length > 0;

  // Se muestran las últimas y se resume el resto: nunca scroll
  const visibleAnswers = answers.slice(-MAX_VISIBLE_ANSWERS);
  const hiddenAnswers = answers.length - visibleAnswers.length;

  const guessers = result.correctGuessers.slice(0, MAX_VISIBLE_ANSWERS);
  const hiddenGuessers = result.correctGuessers.length - guessers.length;

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Palabra revelada */}
      <header className="flex-none text-center">
        <div className="flex items-center justify-center gap-3 mb-1.5">
          <span className="text-slate-400 font-bold uppercase tracking-widest text-lg">
            Ronda terminada
          </span>
          {result.wasAllPlay ? (
            <span className="bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 text-base font-black px-3 py-1 rounded-full">
              ✨ JUGARON TODOS
            </span>
          ) : (
            result.turnTeamName && (
              <span className="bg-slate-800 border border-slate-700 text-slate-300 text-base font-bold px-3 py-1 rounded-full">
                Turno de {result.turnTeamName}
              </span>
            )
          )}
        </div>

        <div className="inline-block bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500 p-1 rounded-3xl shadow-2xl max-w-full">
          <div className="bg-slate-950 px-12 py-3 rounded-[22px]">
            <span className="text-lg font-bold text-amber-400 block tracking-wider uppercase">
              La palabra era · {getCategoryLabel(result.category)}
            </span>
            <h2 className="tv-heading text-6xl font-black font-game text-white tracking-wide uppercase">
              {result.word}
            </h2>
          </div>
        </div>
      </header>

      {/* Dibujo + respuestas */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
        <div className="col-span-6 min-h-0">
          <TVCanvas className="border-4 border-slate-700" />
        </div>

        <div className="col-span-6 panel p-5 flex flex-col gap-3 min-h-0">
          {/* Dibujante */}
          <div className="flex-none bg-slate-950/70 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-4xl flex-shrink-0" aria-hidden="true">
                ✏️
              </span>
              <div className="min-w-0">
                <p className="font-bold text-white text-2xl truncate">{result.drawerName}</p>
                <p className="text-base text-slate-400">Dibujante de la ronda</p>
              </div>
            </div>
            <span className="bg-amber-500/20 text-amber-300 font-mono font-bold px-4 py-2 rounded-xl border border-amber-500/30 text-xl flex-shrink-0">
              +{result.drawerPoints}
            </span>
          </div>

          <h4 className="flex-none text-lg font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <UserCheck size={20} className="text-emerald-400" />
            <span>
              {hasAnswerLog
                ? `Respuestas (${answers.length})`
                : `Aciertos (${result.correctGuessers.length})`}
            </span>
          </h4>

          {/* Lista repartida en el alto exacto */}
          <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
            {hasAnswerLog ? (
              visibleAnswers.map((answer) => (
                <div
                  key={`${answer.playerId}_${answer.submittedAt}`}
                  className={`flex-1 min-h-0 rounded-xl px-4 flex items-center justify-between gap-4 border ${
                    answer.isCorrect
                      ? 'bg-emerald-500/15 border-emerald-500/40'
                      : answer.isClose
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-slate-950/60 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {answer.isCorrect ? (
                      <CheckCircle2 size={24} className="text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle size={24} className="text-slate-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-white text-xl truncate">"{answer.text}"</p>
                      <p className="text-base text-slate-400 truncate">
                        {answer.teamName !== 'Sin equipo' && (
                          <span style={{ color: answer.teamColor }}>{answer.teamName} · </span>
                        )}
                        {answer.playerName}
                        {answer.isClose && !answer.isCorrect && ' · estuvo cerca'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold text-xl flex-shrink-0 ${
                      answer.isCorrect ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {answer.isCorrect ? `+${answer.points}` : '—'}
                  </span>
                </div>
              ))
            ) : result.correctGuessers.length === 0 ? (
              <p className="flex-1 flex items-center justify-center text-slate-500 font-medium text-2xl text-center">
                Nadie logró adivinar la palabra 😢
              </p>
            ) : (
              guessers.map((guesser) => (
                <div
                  key={guesser.playerId}
                  className="flex-1 min-h-0 bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-lg bg-slate-800 text-slate-300 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0">
                      {guesser.order}
                    </span>
                    <span className="font-bold text-white text-xl truncate">
                      {guesser.playerName}
                    </span>
                    <span className="text-base text-slate-500 font-mono flex-shrink-0">
                      {guesser.timeTakenSeconds}s
                    </span>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold text-xl flex-shrink-0">
                    +{guesser.points}
                  </span>
                </div>
              ))
            )}

            {(hiddenAnswers > 0 || hiddenGuessers > 0) && (
              <p className="flex-none text-center text-slate-500 text-base">
                y {hiddenAnswers > 0 ? hiddenAnswers : hiddenGuessers} más
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progreso hacia la tabla */}
      <div className="flex-none space-y-1.5">
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-2xl mx-auto">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-pink-500 rounded-full"
            style={{ width: `${percent}%`, transition: 'width 200ms linear' }}
          />
        </div>
        <p className="text-center text-slate-400 text-xl font-medium">
          Cargando tabla de posiciones...
        </p>
      </div>
    </div>
  );
};
