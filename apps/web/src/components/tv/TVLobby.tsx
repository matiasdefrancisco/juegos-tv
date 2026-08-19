import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CATEGORIES,
  GameMode,
  GameSettings,
  getDifficultyMeta,
  RoundMode
} from '@party-draw/shared';
import { Play, QrCode, Settings, Smartphone, Sparkles, Users } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { Modal } from '../common/Modal';
import { GameSetupPanel } from '../common/GameSetupPanel';
import { TeamBoard } from '../common/TeamBoard';

export const TVLobby: React.FC = () => {
  const { gameState, gameCode, startGame, updateSettings } = useSocket();
  const [showSettings, setShowSettings] = useState(false);

  if (!gameState || !gameCode) return null;

  const { settings } = gameState;
  const joinUrl = `${window.location.protocol}//${window.location.host}/join/${gameCode}`;
  const isLocalhostUrl = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

  const players = gameState.players || [];
  const connectedPlayers = players.filter((p) => p.connected);
  const isTeamMode = settings.mode === GameMode.TEAMS;

  const activeTeams = gameState.teams.filter((team) =>
    connectedPlayers.some((p) => p.teamId === team.id)
  );

  const canStart = isTeamMode ? activeTeams.length >= 2 : connectedPlayers.length >= 2;

  const startHint = canStart
    ? '¡Todo listo para comenzar!'
    : isTeamMode
    ? 'Hacen falta al menos 2 equipos con jugadores'
    : 'Se necesitan al menos 2 jugadores';

  const handleSettingsChange = (patch: Partial<GameSettings>) => updateSettings(patch);

  const difficulty = getDifficultyMeta(settings.difficulty);
  const categoryLabels = settings.categories
    .map((id) => CATEGORIES.find((c) => c.id === id)?.label ?? id)
    .join(' · ');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Encabezado */}
      <header className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 px-4 py-1.5 rounded-full text-indigo-300 font-semibold text-xs sm:text-sm"
        >
          <Sparkles size={14} />
          <span>¡DIBUJO Y ADIVINANZA MULTIJUGADOR!</span>
        </motion.div>

        <h2 className="tv-title font-black font-game text-white tracking-tight">SALA DE ESPERA</h2>
        <p className="tv-subtitle text-slate-400 font-medium max-w-2xl mx-auto">
          Entrá desde tu celular escaneando el código QR o cargando el código de sala
        </p>
      </header>

      {/* Cuerpo: QR + jugadores. En pantallas angostas se apila. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Ingreso */}
        <motion.section
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="lg:col-span-5 panel p-5 sm:p-6 flex flex-col items-center text-center gap-4"
        >
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm sm:text-base uppercase tracking-wider">
            <Smartphone size={20} />
            <span>Escaneá con tu celular</span>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl">
            <QRCodeSVG
              value={joinUrl}
              size={168}
              level="M"
              includeMargin={false}
              className="w-[clamp(120px,18vh,200px)] h-[clamp(120px,18vh,200px)]"
            />
          </div>

          <div className="w-full space-y-1.5">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              O ingresá el código
            </span>
            <div className="bg-slate-950/80 border border-slate-700 py-2.5 px-4 rounded-2xl">
              <span className="tv-code font-mono font-black tracking-[0.2em] text-amber-400">
                {gameCode}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block font-mono break-all">{joinUrl}</span>

            {isLocalhostUrl && (
              <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 mt-2 leading-relaxed text-left">
                Estás en <span className="font-mono">localhost</span>: los celulares no van a poder
                entrar con este QR. Abrí la TV usando la IP de red de esta computadora.
              </p>
            )}
          </div>
        </motion.section>

        {/* Jugadores o equipos */}
        <section className="lg:col-span-7 panel p-5 sm:p-6 flex flex-col gap-4">
          <header className="flex items-center justify-between gap-3 border-b border-slate-700/70 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Users className="text-pink-400 flex-shrink-0" size={22} />
              <h3 className="text-lg sm:text-xl font-bold text-white font-game truncate">
                {isTeamMode ? 'Equipos' : 'Jugadores conectados'}
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowSettings(true)}
                className="btn-ghost px-3 py-2 flex items-center gap-2 text-sm font-bold"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">Configurar</span>
              </button>

              <span className="bg-indigo-600/30 text-indigo-300 font-mono font-bold px-3 py-1.5 rounded-xl text-sm border border-indigo-500/30">
                {connectedPlayers.length}
                {!isTeamMode && ` / ${settings.maxPlayers}`}
              </span>
            </div>
          </header>

          {/* Zona de listado con scroll propio y alto acotado */}
          <div className="scroll-area max-h-[42vh] min-h-[140px] pr-1">
            {isTeamMode ? (
              <TeamBoard
                teams={gameState.teams}
                players={connectedPlayers}
                maxPerTeam={settings.maxPlayersPerTeam}
                compact
              />
            ) : connectedPlayers.length === 0 ? (
              <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-slate-500 gap-3 py-6">
                <QrCode size={40} className="animate-pulse opacity-40" />
                <p className="text-sm sm:text-base font-medium text-center">
                  Esperando a que los jugadores se unan...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
                <AnimatePresence>
                  {connectedPlayers.map((p) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className="bg-slate-950/60 border border-slate-700/60 rounded-2xl p-2.5 flex items-center gap-2.5 min-w-0"
                    >
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                        aria-hidden="true"
                      >
                        {p.avatar}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{p.name}</p>
                        {p.isHost && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-semibold">
                            ANFITRIÓN
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Resumen de configuración */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-700/60 text-center">
            <SummaryChip label="Modalidad" value={isTeamMode ? 'Equipos' : 'Todos vs todos'} />
            <SummaryChip
              label="Dificultad"
              value={`${difficulty.emoji} ${difficulty.label}`}
            />
            <SummaryChip
              label="Ronda"
              value={settings.roundMode === RoundMode.RISK ? '🎲 Riesgo' : '⏱️ Tiempo'}
            />
            <SummaryChip
              label="Partida"
              value={`${settings.totalRounds}×${settings.roundDuration}s`}
            />
          </div>

          <p className="text-[11px] text-slate-500 text-center truncate" title={categoryLabels}>
            Categorías: {categoryLabels}
          </p>

          {/* Acción principal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-700/60">
            <p className="text-slate-400 text-sm text-center sm:text-left">{startHint}</p>

            <button
              onClick={startGame}
              disabled={!canStart}
              className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-lg font-bold font-game transition-all ${
                canStart ? 'btn-game-yellow' : 'btn-disabled'
              }`}
            >
              <Play size={20} fill="currentColor" />
              <span>INICIAR PARTIDA</span>
            </button>
          </div>
        </section>
      </div>

      {/* Configuración en modal con scroll interno */}
      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="Configuración de partida"
        subtitle="Los cambios se aplican al instante para todos los jugadores"
        size="lg"
        footer={
          <button
            onClick={() => setShowSettings(false)}
            className="btn-game-primary w-full py-3 text-base"
          >
            Listo
          </button>
        }
      >
        <GameSetupPanel settings={settings} onChange={handleSettingsChange} />
      </Modal>
    </div>
  );
};

const SummaryChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="panel-soft px-2 py-2 min-w-0">
    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
      {label}
    </span>
    <span className="block text-xs sm:text-sm font-bold text-white truncate">{value}</span>
  </div>
);
