import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CATEGORIES, GameMode, GameSettings, getDifficultyMeta, RoundMode } from '@party-draw/shared';
import { Play, QrCode, Settings, Smartphone, Users } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { Modal } from '../common/Modal';
import { GameSetupPanel } from '../common/GameSetupPanel';
import { TeamBoard } from '../common/TeamBoard';

/**
 * Densidad de la grilla de jugadores según cuántos haya.
 * En vez de scrollear, la grilla se reacomoda y achica: en una TV el contenido
 * tiene que entrar entero siempre.
 */
function gridFor(count: number) {
  if (count <= 4) return { cols: 2, avatar: 72, name: 'text-2xl', pad: 'p-4' };
  if (count <= 9) return { cols: 3, avatar: 60, name: 'text-xl', pad: 'p-3' };
  if (count <= 16) return { cols: 4, avatar: 48, name: 'text-lg', pad: 'p-2.5' };
  return { cols: 5, avatar: 40, name: 'text-base', pad: 'p-2' };
}

export const TVLobby: React.FC = () => {
  const { gameState, gameCode, startGame, updateSettings } = useSocket();
  const [showSettings, setShowSettings] = useState(false);

  if (!gameState || !gameCode) return null;

  const { settings } = gameState;
  const joinUrl = `${window.location.protocol}//${window.location.host}/join/${gameCode}`;
  const isLocalhostUrl = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

  const connectedPlayers = gameState.players.filter((p) => p.connected);
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

  const difficulty = getDifficultyMeta(settings.difficulty);
  const categoryLabels = settings.categories
    .map((id) => CATEGORIES.find((c) => c.id === id)?.label ?? id)
    .join(' · ');

  const grid = gridFor(connectedPlayers.length);

  return (
    <div className="w-full h-full flex flex-col gap-5">
      {/* Título */}
      <header className="flex-none text-center">
        <h2 className="tv-heading text-6xl font-black font-game text-white tracking-tight">
          SALA DE ESPERA
        </h2>
        <p className="text-2xl text-slate-400 font-medium mt-1">
          Entrá desde tu celular escaneando el QR o cargando el código
        </p>
      </header>

      {/* Cuerpo: QR + jugadores. Ocupa todo el alto restante. */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
        {/* Ingreso */}
        <section className="col-span-4 panel p-6 flex flex-col items-center text-center gap-4 min-h-0">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl uppercase tracking-wider flex-none">
            <Smartphone size={26} />
            <span>Escaneá con tu celular</span>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-xl flex-none">
            <QRCodeSVG value={joinUrl} size={248} level="M" includeMargin={false} />
          </div>

          <div className="w-full flex-none">
            <span className="text-base text-slate-400 font-bold uppercase tracking-widest">
              O ingresá el código
            </span>
            <div className="bg-slate-950/80 border border-slate-700 py-3 px-6 rounded-2xl mt-1">
              <span className="text-[56px] leading-none font-mono font-black tracking-[0.2em] text-amber-400">
                {gameCode}
              </span>
            </div>
            <span className="text-base text-slate-500 block font-mono mt-2 truncate">{joinUrl}</span>
          </div>

          {isLocalhostUrl && (
            <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 leading-snug text-left flex-none">
              Estás en <span className="font-mono">localhost</span>: los celulares no van a poder
              entrar con este QR. Abrí la TV usando la IP de red de esta computadora.
            </p>
          )}
        </section>

        {/* Jugadores o equipos */}
        <section className="col-span-8 panel p-6 flex flex-col gap-4 min-h-0">
          <header className="flex items-center justify-between gap-4 border-b border-slate-700/70 pb-3 flex-none">
            <div className="flex items-center gap-3 min-w-0">
              <Users className="text-pink-400 flex-shrink-0" size={32} />
              <h3 className="text-3xl font-bold text-white font-game truncate">
                {isTeamMode ? 'Equipos' : 'Jugadores conectados'}
              </h3>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowSettings(true)}
                className="btn-ghost px-5 py-3 flex items-center gap-2 text-xl font-bold"
              >
                <Settings size={22} />
                <span>Configurar</span>
              </button>

              <span className="bg-indigo-600/30 text-indigo-300 font-mono font-bold px-4 py-2 rounded-xl text-xl border border-indigo-500/30">
                {connectedPlayers.length}
                {!isTeamMode && ` / ${settings.maxPlayers}`}
              </span>
            </div>
          </header>

          {/* Lista: se comprime, nunca scrollea */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {isTeamMode ? (
              <TeamBoard
                teams={gameState.teams}
                players={connectedPlayers}
                maxPerTeam={settings.maxPlayersPerTeam}
                variant="tv"
              />
            ) : connectedPlayers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <QrCode size={72} className="opacity-40" />
                <p className="text-2xl font-medium">Esperando a que los jugadores se unan...</p>
              </div>
            ) : (
              <div
                className="h-full grid gap-3 content-start"
                style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))` }}
              >
                {connectedPlayers.map((p) => (
                  <div
                    key={p.id}
                    className={`bg-slate-950/60 border border-slate-700/60 rounded-2xl ${grid.pad} flex items-center gap-3 min-w-0`}
                  >
                    <span
                      className="rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0"
                      style={{
                        backgroundColor: p.color,
                        width: grid.avatar,
                        height: grid.avatar,
                        fontSize: grid.avatar * 0.5
                      }}
                      aria-hidden="true"
                    >
                      {p.avatar}
                    </span>
                    <div className="min-w-0">
                      <p className={`font-bold text-white truncate ${grid.name}`}>{p.name}</p>
                      {p.isHost && (
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-semibold">
                          ANFITRIÓN
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen y acción */}
          <div className="flex-none border-t border-slate-700/60 pt-4 flex items-center justify-between gap-6">
            <div className="min-w-0">
              <p className="text-xl text-slate-300 font-medium truncate">
                {isTeamMode ? 'Equipos' : 'Todos contra todos'} · {difficulty.emoji}{' '}
                {difficulty.label} ·{' '}
                {isTeamMode
                  ? `${settings.attemptsPerTurn === 0 ? 'Sin límite' : settings.attemptsPerTurn + ' intento' + (settings.attemptsPerTurn === 1 ? '' : 's')}`
                  : settings.roundMode === RoundMode.RISK
                  ? 'Riesgo'
                  : 'Tiempo'}{' '}
                · {settings.totalRounds} rondas × {settings.roundDuration}s
              </p>
              <p className="text-lg text-slate-500 truncate">{categoryLabels}</p>
              <p className="text-lg text-slate-400 mt-1">{startHint}</p>
            </div>

            <button
              onClick={startGame}
              disabled={!canStart}
              className={`flex-shrink-0 flex items-center justify-center gap-4 px-10 py-5 rounded-2xl text-3xl font-bold font-game ${
                canStart ? 'btn-game-yellow' : 'btn-disabled'
              }`}
            >
              <Play size={32} fill="currentColor" />
              <span>INICIAR</span>
            </button>
          </div>
        </section>
      </div>

      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="Configuración de partida"
        subtitle="Los cambios se aplican al instante para todos"
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
        <GameSetupPanel
          settings={settings}
          onChange={(patch: Partial<GameSettings>) => updateSettings(patch)}
        />
      </Modal>
    </div>
  );
};
