import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES, GameMode, getDifficultyMeta, RoundMode } from '@party-draw/shared';
import { Crown, Settings, Sparkles, Users } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { Modal } from '../common/Modal';
import { GameSetupPanel } from '../common/GameSetupPanel';
import { TeamBoard } from '../common/TeamBoard';

export const MobileLobby: React.FC = () => {
  const { gameState, player, startGame, isHost, setTeam, updateSettings } = useSocket();
  const [showSettings, setShowSettings] = useState(false);

  if (!gameState || !player) return null;

  const { settings } = gameState;
  const isTeamMode = settings.mode === GameMode.TEAMS;
  const connectedPlayers = gameState.players.filter((p) => p.connected);

  const activeTeams = gameState.teams.filter((team) =>
    connectedPlayers.some((p) => p.teamId === team.id)
  );

  const canStart = isTeamMode ? activeTeams.length >= 2 : connectedPlayers.length >= 2;
  const difficulty = getDifficultyMeta(settings.difficulty);

  const categoryLabels = settings.categories
    .map((id) => CATEGORIES.find((c) => c.id === id)?.label ?? id)
    .join(' · ');

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 flex flex-col gap-4 min-h-full">
      <header className="text-center space-y-1.5 flex-shrink-0">
        <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full text-indigo-300 font-semibold text-[11px]">
          <Sparkles size={12} />
          <span>¡ESTÁS DENTRO!</span>
        </div>
        <h2 className="text-2xl font-black font-game text-white">SALA DE ESPERA</h2>
      </header>

      {/* Perfil */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="panel p-5 space-y-3 text-center flex-shrink-0"
      >
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg border-2 border-white/30"
          style={{ backgroundColor: player.color }}
          aria-hidden="true"
        >
          {player.avatar}
        </div>

        <div>
          <h3 className="font-black text-xl text-white font-game truncate">{player.name}</h3>
          {isHost && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full mt-1">
              <Crown size={11} />
              <span>Anfitrión</span>
            </span>
          )}
        </div>

        <div className="panel-soft py-2 px-3 flex items-center justify-between text-sm">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Users size={15} />
            <span>Jugadores</span>
          </span>
          <span className="font-mono font-bold text-indigo-400">
            {connectedPlayers.length}
            {!isTeamMode && ` / ${settings.maxPlayers}`}
          </span>
        </div>
      </motion.div>

      {/* Equipos o lista de jugadores */}
      {isTeamMode ? (
        <section className="space-y-2 flex-shrink-0">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Tocá un equipo para unirte
          </h4>
          <TeamBoard
            teams={gameState.teams}
            players={connectedPlayers}
            maxPerTeam={settings.maxPlayersPerTeam}
            onSelectTeam={(teamId) => setTeam(teamId)}
            highlightTeamId={player.teamId}
            highlightPlayerId={player.id}
            compact
          />
        </section>
      ) : (
        <section className="flex flex-wrap justify-center gap-1.5 flex-shrink-0">
          {connectedPlayers.map((p) => (
            <span
              key={p.id}
              title={p.name}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${
                p.id === player.id ? 'border-white/70 ring-2 ring-indigo-500' : 'border-white/20'
              }`}
              style={{ backgroundColor: p.color }}
              aria-hidden="true"
            >
              {p.avatar}
            </span>
          ))}
        </section>
      )}

      {/* Resumen de la configuración */}
      <section className="panel-soft p-3 space-y-1.5 text-xs flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400">Modalidad</span>
          <span className="font-bold text-white truncate">
            {isTeamMode ? 'Equipos' : 'Todos contra todos'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400">Dificultad</span>
          <span className="font-bold text-white">
            {difficulty.emoji} {difficulty.label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400">Ronda</span>
          <span className="font-bold text-white">
            {settings.roundMode === RoundMode.RISK ? '🎲 Riesgo' : '⏱️ Tiempo'} ·{' '}
            {settings.roundDuration}s
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-slate-400 flex-shrink-0">Categorías</span>
          <span className="font-bold text-white text-right">{categoryLabels}</span>
        </div>
      </section>

      {/* Acciones */}
      <div className="mt-auto pt-2 space-y-2 flex-shrink-0 safe-bottom">
        {isHost && (
          <button
            onClick={() => setShowSettings(true)}
            className="btn-ghost w-full py-3 flex items-center justify-center gap-2 text-sm font-bold"
          >
            <Settings size={16} />
            <span>Configurar partida</span>
          </button>
        )}

        {isHost ? (
          <button
            onClick={startGame}
            disabled={!canStart}
            className={`w-full py-4 rounded-2xl text-lg font-bold font-game ${
              canStart ? 'btn-game-yellow' : 'btn-disabled'
            }`}
          >
            {canStart
              ? 'INICIAR PARTIDA'
              : isTeamMode
              ? 'FALTAN EQUIPOS CON JUGADORES'
              : 'ESPERANDO MÁS JUGADORES...'}
          </button>
        ) : (
          <div className="panel-soft py-3.5 px-4 text-slate-400 text-sm font-semibold text-center">
            Esperando a que el anfitrión inicie la partida...
          </div>
        )}
      </div>

      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="Configuración"
        subtitle="Se aplica al instante para todos"
        size="md"
        footer={
          <button
            onClick={() => setShowSettings(false)}
            className="btn-game-primary w-full py-3 text-base"
          >
            Listo
          </button>
        }
      >
        <GameSetupPanel settings={settings} onChange={(patch) => updateSettings(patch)} />
      </Modal>
    </div>
  );
};
