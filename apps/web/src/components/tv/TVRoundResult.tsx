import React from 'react';
import { motion } from 'framer-motion';
import { getCategoryLabel } from '@party-draw/shared';
import { CheckCircle2, UserCheck, XCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { usePhaseCountdown } from '../../utils/usePhaseCountdown';
import { TVCanvas } from './TVCanvas';

export const TVRoundResult: React.FC = () => {
  const { gameState } = useSocket();
  const { percent } = usePhaseCountdown(gameState?.phaseEndsAt);
  const result = gameState?.lastRoundResult;

  if (!result) return null;

  const hasTeamAnswers = result.teamAnswers && result.teamAnswers.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 min-h-full">
      {/* Revelación de la palabra */}
      <motion.header
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-2 flex-shrink-0"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-slate-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
            Ronda terminada
          </span>
          {result.wasAllPlay ? (
            <span className="bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 text-[11px] font-black px-2.5 py-1 rounded-full">
              ✨ JUGARON TODOS
            </span>
          ) : (
            result.turnTeamName && (
              <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-full">
                Turno de {result.turnTeamName}
              </span>
            )
          )}
        </div>

        <div className="inline-block bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500 p-1 rounded-3xl shadow-2xl max-w-full">
          <div className="bg-slate-950 px-5 sm:px-10 py-3 rounded-[20px]">
            <span className="text-[11px] sm:text-sm font-bold text-amber-400 block tracking-wider uppercase mb-1">
              La palabra era · {getCategoryLabel(result.category)}
            </span>
            <h2 className="tv-title font-black font-game text-white tracking-wide uppercase break-words">
              {result.word}
            </h2>
          </div>
        </div>
      </motion.header>

      {/* Dibujo + resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-6 min-h-[clamp(200px,32vh,460px)]">
          <TVCanvas className="border-4 border-slate-700" />
        </div>

        <div className="lg:col-span-6 panel p-4 sm:p-5 flex flex-col gap-3 min-h-0">
          {/* Dibujante */}
          <div className="bg-slate-950/70 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl flex-shrink-0" aria-hidden="true">
                ✏️
              </span>
              <div className="min-w-0">
                <p className="font-bold text-white text-base truncate">{result.drawerName}</p>
                <p className="text-[11px] text-slate-400">Dibujante de la ronda</p>
              </div>
            </div>
            <span className="bg-amber-500/20 text-amber-300 font-mono font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 text-sm flex-shrink-0">
              +{result.drawerPoints}
            </span>
          </div>

          {/* Respuestas por equipo (modo equipos / riesgo) */}
          {hasTeamAnswers ? (
            <div className="flex flex-col gap-2 min-h-0">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 flex-shrink-0">
                <UserCheck size={16} className="text-emerald-400" />
                <span>Respuestas ({result.teamAnswers.length})</span>
              </h4>

              <div className="scroll-area flex-1 max-h-[30vh] space-y-2 pr-1">
                {result.teamAnswers.map((answer, idx) => (
                  <motion.div
                    key={`${answer.playerId}_${answer.submittedAt}`}
                    initial={{ x: 16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.1, 0.6) }}
                    className={`rounded-xl p-2.5 border flex items-center justify-between gap-3 ${
                      answer.isCorrect
                        ? 'bg-emerald-500/15 border-emerald-500/40'
                        : answer.isClose
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-slate-950/60 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {answer.isCorrect ? (
                        <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle size={18} className="text-slate-500 flex-shrink-0" />
                      )}

                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">"{answer.text}"</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {answer.teamName !== 'Sin equipo' && (
                            <span style={{ color: answer.teamColor }}>{answer.teamName} · </span>
                          )}
                          {answer.playerName}
                          {answer.isClose && !answer.isCorrect && ' · estuvo cerca'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`font-mono font-bold text-sm flex-shrink-0 ${
                        answer.isCorrect ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {answer.isCorrect ? `+${answer.points}` : '—'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            /* Aciertos individuales */
            <div className="flex flex-col gap-2 min-h-0">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 flex-shrink-0">
                <UserCheck size={16} className="text-emerald-400" />
                <span>Aciertos ({result.correctGuessers.length})</span>
              </h4>

              {result.correctGuessers.length === 0 ? (
                <p className="text-slate-500 text-center py-6 font-medium text-sm">
                  Nadie logró adivinar la palabra esta ronda 😢
                </p>
              ) : (
                <div className="scroll-area flex-1 max-h-[30vh] space-y-2 pr-1">
                  {result.correctGuessers.map((guesser, idx) => (
                    <motion.div
                      key={guesser.playerId}
                      initial={{ x: 16, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.1, 0.6) }}
                      className="bg-slate-950/60 border border-slate-700/50 rounded-xl p-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono font-bold text-xs bg-slate-800 text-slate-300 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                          {guesser.order}
                        </span>
                        <span className="font-bold text-white text-sm truncate">
                          {guesser.playerName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">
                          {guesser.timeTakenSeconds}s
                        </span>
                      </div>
                      <span className="text-emerald-400 font-mono font-bold text-sm flex-shrink-0">
                        +{guesser.points}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progreso hacia la tabla */}
      <div className="space-y-1.5 flex-shrink-0">
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-md mx-auto">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-pink-500 rounded-full transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-center text-slate-400 text-xs sm:text-sm font-medium">
          Cargando tabla de posiciones...
        </p>
      </div>
    </div>
  );
};
