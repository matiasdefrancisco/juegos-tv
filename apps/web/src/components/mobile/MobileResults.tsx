import React from 'react';
import { motion } from 'framer-motion';
import { GameMode, getCategoryLabel } from '@party-draw/shared';
import { CheckCircle2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const MobileResults: React.FC = () => {
  const { gameState, player, team } = useSocket();

  if (!gameState || !player) return null;

  const result = gameState.lastRoundResult;
  const isTeamMode = gameState.settings.mode === GameMode.TEAMS;
  const isDrawer = result?.drawerId === player.id;
  const earnedPoints = player.currentRoundScore;

  // La posición se calcula sobre equipos o jugadores según la modalidad
  const ranking = isTeamMode
    ? [...gameState.teams]
        .filter((t) => gameState.players.some((p) => p.teamId === t.id))
        .sort((a, b) => b.score - a.score)
        .map((t) => t.id)
    : [...gameState.players].sort((a, b) => b.score - a.score).map((p) => p.id);

  const myKey = isTeamMode ? player.teamId : player.id;
  const currentRank = myKey ? ranking.indexOf(myKey) + 1 : 0;

  const myAnswer = result?.teamAnswers?.find((a) => a.playerId === player.id);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 flex flex-col gap-4 min-h-full text-center safe-bottom">
      {/* Palabra revelada */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-1.5 flex-shrink-0"
      >
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          La palabra era · {getCategoryLabel(result?.category)}
        </span>
        <div className="bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500 p-0.5 rounded-2xl shadow-lg">
          <div className="bg-slate-900 px-4 py-2.5 rounded-[14px]">
            <h3 className="text-xl sm:text-2xl font-black font-game text-white tracking-wide uppercase break-words">
              {result?.word || '...'}
            </h3>
          </div>
        </div>
      </motion.div>

      {/* Resultado personal */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="panel p-5 space-y-3.5 flex-shrink-0"
      >
        <div className="space-y-1">
          {earnedPoints > 0 ? (
            <>
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
              <h4 className="text-lg font-bold text-white font-game">
                {isDrawer ? '¡Puntos por tu dibujo!' : '¡Adivinaste la palabra!'}
              </h4>
              <p className="text-emerald-400 font-mono font-black text-3xl">+{earnedPoints} pts</p>
            </>
          ) : (
            <>
              <span className="text-3xl block" aria-hidden="true">
                😢
              </span>
              <h4 className="text-lg font-bold text-white font-game">
                {isDrawer ? 'Nadie acertó tu dibujo' : 'No acertaste esta vez'}
              </h4>
              <p className="text-slate-400 text-sm">¡La próxima te va a ir mejor!</p>
            </>
          )}
        </div>

        {/* Qué respondí (modo riesgo / equipos) */}
        {myAnswer && (
          <div
            className={`text-xs rounded-xl px-3 py-2 border ${
              myAnswer.isCorrect
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-950/60 border-slate-700 text-slate-400'
            }`}
          >
            Tu respuesta: <strong>"{myAnswer.text}"</strong>
            {myAnswer.isClose && !myAnswer.isCorrect && ' — estuviste cerca'}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-700">
          <div className="panel-soft p-2.5">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
              {isTeamMode ? 'Puntos del equipo' : 'Puntaje total'}
            </span>
            <span className="font-mono text-xl font-black text-amber-400">
              {isTeamMode ? team?.score ?? 0 : player.score}
            </span>
          </div>

          <div className="panel-soft p-2.5">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
              Posición
            </span>
            <span className="font-mono text-xl font-black text-indigo-400">
              #{currentRank || '-'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Detalle de respuestas por equipo */}
      {isTeamMode && result?.teamAnswers && result.teamAnswers.length > 0 && (
        <section className="space-y-1.5 flex-shrink-0 text-left">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Respuestas de la ronda
          </h5>
          <div className="space-y-1.5">
            {result.teamAnswers.map((answer) => (
              <div
                key={`${answer.playerId}_${answer.submittedAt}`}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs ${
                  answer.isCorrect
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-700/60'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">"{answer.text}"</p>
                  <p className="text-[10px]" style={{ color: answer.teamColor }}>
                    {answer.teamName}
                  </p>
                </div>
                <span
                  className={`font-mono font-bold flex-shrink-0 ${
                    answer.isCorrect ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {answer.isCorrect ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-auto panel-soft py-3 px-4 text-slate-400 text-xs font-semibold flex-shrink-0">
        Mirá el televisor para ver la tabla completa
      </div>
    </div>
  );
};
