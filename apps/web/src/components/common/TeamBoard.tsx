import React from 'react';
import { motion } from 'framer-motion';
import { Player, Team } from '@party-draw/shared';
import { UserPlus } from 'lucide-react';

interface TeamBoardProps {
  teams: Team[];
  players: Player[];
  maxPerTeam: number;
  /** Si se pasa, cada equipo es clickeable para unirse */
  onSelectTeam?: (teamId: string) => void;
  highlightTeamId?: string | null;
  highlightPlayerId?: string | null;
  compact?: boolean;
}

/**
 * Tablero de equipos con sus integrantes.
 * Se usa en la TV (solo lectura) y en el celular (para elegir equipo).
 */
export const TeamBoard: React.FC<TeamBoardProps> = ({
  teams,
  players,
  maxPerTeam,
  onSelectTeam,
  highlightTeamId,
  highlightPlayerId,
  compact = false
}) => {
  return (
    <div
      className={`grid gap-2.5 ${
        compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
      }`}
    >
      {teams.map((team) => {
        const members = players.filter((p) => p.teamId === team.id && p.connected);
        const isFull = members.length >= maxPerTeam;
        const isMine = highlightTeamId === team.id;

        const content = (
          <>
            <header className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0 border border-white/20"
                  style={{ backgroundColor: team.color }}
                  aria-hidden="true"
                >
                  {team.emoji}
                </span>
                <span className="font-game font-black text-white truncate">{team.name}</span>
              </div>

              <span className="text-[11px] font-mono font-bold text-slate-400 flex-shrink-0 bg-slate-950/70 px-2 py-0.5 rounded-lg">
                {members.length}/{maxPerTeam}
              </span>
            </header>

            {members.length === 0 ? (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-1.5">
                <UserPlus size={14} className="flex-shrink-0" />
                <span>Sin jugadores todavía</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {members.map((member) => (
                  <motion.span
                    key={member.id}
                    layout
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg bg-slate-950/70 border text-xs font-bold text-white max-w-full ${
                      member.id === highlightPlayerId ? 'border-white/60' : 'border-slate-700/60'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-[11px] flex-shrink-0"
                      style={{ backgroundColor: member.color }}
                      aria-hidden="true"
                    >
                      {member.avatar}
                    </span>
                    <span className="truncate max-w-[88px]">{member.name}</span>
                  </motion.span>
                ))}
              </div>
            )}

            {isMine && (
              <p className="text-[11px] font-bold mt-2" style={{ color: team.color }}>
                Tu equipo
              </p>
            )}
          </>
        );

        const baseClass = `rounded-2xl border-2 p-3 text-left transition-all w-full ${
          isMine ? 'bg-slate-800 shadow-xl' : 'bg-slate-900/70 border-slate-700/70'
        }`;

        if (onSelectTeam) {
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => onSelectTeam(team.id)}
              disabled={isFull && !isMine}
              aria-pressed={isMine}
              className={`${baseClass} hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400`}
              style={isMine ? { borderColor: team.color } : undefined}
            >
              {content}
            </button>
          );
        }

        return (
          <div
            key={team.id}
            className={baseClass}
            style={isMine ? { borderColor: team.color } : undefined}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
};
