import React from 'react';
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
  /** 'tv' reparte los equipos en todo el alto disponible, sin scroll */
  variant?: 'default' | 'tv';
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
  compact = false,
  variant = 'default'
}) => {
  const isTv = variant === 'tv';

  // En TV la grilla ocupa el alto completo y se reparte en filas iguales
  const tvCols = teams.length <= 2 ? 2 : teams.length <= 4 ? 2 : 3;
  const tvRows = Math.ceil(teams.length / tvCols);

  return (
    <div
      className={
        isTv
          ? 'h-full grid gap-4'
          : `grid gap-2.5 ${
              compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
            }`
      }
      style={
        isTv
          ? {
              gridTemplateColumns: `repeat(${tvCols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${tvRows}, minmax(0, 1fr))`
            }
          : undefined
      }
    >
      {teams.map((team) => {
        const members = players.filter((p) => p.teamId === team.id && p.connected);
        const isFull = members.length >= maxPerTeam;
        const isMine = highlightTeamId === team.id;

        const content = (
          <>
            <header
              className={`flex items-center justify-between gap-2 ${isTv ? 'mb-3' : 'mb-2'}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20 ${
                    isTv ? 'w-12 h-12 text-3xl' : 'w-8 h-8 text-lg'
                  }`}
                  style={{ backgroundColor: team.color }}
                  aria-hidden="true"
                >
                  {team.emoji}
                </span>
                <span
                  className={`font-game font-black text-white truncate ${isTv ? 'text-3xl' : ''}`}
                >
                  {team.name}
                </span>
              </div>

              <span
                className={`font-mono font-bold text-slate-400 flex-shrink-0 bg-slate-950/70 rounded-lg ${
                  isTv ? 'text-lg px-3 py-1' : 'text-[11px] px-2 py-0.5'
                }`}
              >
                {members.length}/{maxPerTeam}
              </span>
            </header>

            {members.length === 0 ? (
              <div
                className={`flex items-center gap-2 text-slate-500 ${
                  isTv ? 'text-xl py-2' : 'text-xs py-1.5'
                }`}
              >
                <UserPlus size={isTv ? 22 : 14} className="flex-shrink-0" />
                <span>Sin jugadores todavía</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 content-start">
                {members.map((member) => (
                  <span
                    key={member.id}
                    className={`flex items-center rounded-lg bg-slate-950/70 border font-bold text-white max-w-full ${
                      isTv ? 'gap-2 pl-1.5 pr-3 py-1.5 text-xl' : 'gap-1.5 pl-1 pr-2 py-1 text-xs'
                    } ${member.id === highlightPlayerId ? 'border-white/60' : 'border-slate-700/60'}`}
                  >
                    <span
                      className={`rounded flex items-center justify-center flex-shrink-0 ${
                        isTv ? 'w-8 h-8 text-lg' : 'w-5 h-5 text-[11px]'
                      }`}
                      style={{ backgroundColor: member.color }}
                      aria-hidden="true"
                    >
                      {member.avatar}
                    </span>
                    <span className={`truncate ${isTv ? 'max-w-[160px]' : 'max-w-[88px]'}`}>
                      {member.name}
                    </span>
                  </span>
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

        const baseClass = `rounded-2xl border-2 text-left transition-all w-full overflow-hidden ${
          isTv ? 'p-4 min-h-0' : 'p-3'
        } ${isMine ? 'bg-slate-800 shadow-xl' : 'bg-slate-900/70 border-slate-700/70'}`;

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
