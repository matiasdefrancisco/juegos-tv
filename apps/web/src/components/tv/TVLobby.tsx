import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, Sparkles, Smartphone, QrCode, Settings, SlidersHorizontal, Check } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const TVLobby: React.FC = () => {
  const { gameState, gameCode, startGame, updateSettings } = useSocket();
  const [showSettings, setShowSettings] = useState(false);

  if (!gameState || !gameCode) return null;

  const currentHost = window.location.host;
  const protocol = window.location.protocol;
  const joinUrl = `${protocol}//${currentHost}/join/${gameCode}`;

  const players = gameState.players || [];
  const canStart = players.length >= 2;

  const handleUpdateRounds = (totalRounds: number) => {
    updateSettings({ totalRounds });
  };

  const handleUpdateDuration = (roundDuration: number) => {
    updateSettings({ roundDuration });
  };

  const handleUpdateMaxPlayers = (maxPlayers: number) => {
    updateSettings({ maxPlayers });
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-500/30 px-4 py-1.5 rounded-full text-indigo-300 font-semibold text-sm"
        >
          <Sparkles size={16} />
          <span>¡DIBUJO Y ADIVINANZA MULTIJUGADOR!</span>
        </motion.div>
        <h2 className="text-5xl md:text-6xl font-black font-game text-white tracking-tight">
          SALA DE ESPERA
        </h2>
        <p className="text-slate-400 text-lg md:text-xl font-medium">
          Entrá desde tu celular escaneando el código QR o ingresando a la dirección web
        </p>
      </div>

      {/* Main Center Area: QR Card + Join Code + Players Grid / Settings Modal */}
      <div className="grid grid-cols-12 gap-8 my-auto items-center">
        {/* Left Card: QR & Code */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="col-span-5 bg-slate-800/90 border-2 border-indigo-500/40 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6"
        >
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-lg uppercase tracking-wider">
            <Smartphone size={24} />
            <span>Escaneá con tu celular</span>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xl">
            <QRCodeSVG
              value={joinUrl}
              size={220}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="w-full space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              O ingresá el código
            </span>
            <div className="bg-slate-900/90 border border-slate-700 py-3 px-6 rounded-2xl">
              <span className="font-mono text-5xl font-black tracking-widest text-amber-400">
                {gameCode}
              </span>
            </div>
            <span className="text-xs text-slate-500 block pt-1 font-mono">
              {joinUrl}
            </span>
          </div>
        </motion.div>

        {/* Right Area: Players Grid or Settings Toggle */}
        <div className="col-span-7 bg-slate-800/60 border border-slate-700/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between min-h-[460px]">
          {showSettings ? (
            /* Settings Panel */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div className="flex items-center space-x-3">
                  <Settings className="text-amber-400" size={28} />
                  <h3 className="text-2xl font-bold text-white font-game">Configuración de Partida</h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm"
                >
                  Volver al Lobby
                </button>
              </div>

              <div className="space-y-5">
                {/* Total Rounds */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Cantidad de Rondas
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[3, 5, 8].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleUpdateRounds(r)}
                        className={`py-3 px-4 rounded-xl font-game font-bold text-lg border transition-all ${
                          gameState.settings.totalRounds === r
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {r} Rondas
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration per round */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Tiempo por Turno
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[30, 60, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleUpdateDuration(d)}
                        className={`py-3 px-4 rounded-xl font-game font-bold text-lg border transition-all ${
                          gameState.settings.roundDuration === d
                            ? 'bg-pink-600 border-pink-400 text-white shadow-lg'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {d} Segundos
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Players */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Máximo de Jugadores
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[4, 8, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleUpdateMaxPlayers(m)}
                        className={`py-3 px-4 rounded-xl font-game font-bold text-lg border transition-all ${
                          gameState.settings.maxPlayers === m
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Hasta {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Players List Panel */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div className="flex items-center space-x-3">
                  <Users className="text-pink-400" size={28} />
                  <h3 className="text-2xl font-bold text-white font-game">Jugadores Conectados</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Ajustes de partida"
                  >
                    <SlidersHorizontal size={20} />
                  </button>
                  <span className="bg-indigo-600/30 text-indigo-300 font-mono font-bold px-3 py-1 rounded-xl text-lg border border-indigo-500/30">
                    {players.length} / {gameState.settings.maxPlayers}
                  </span>
                </div>
              </div>

              {players.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <QrCode size={48} className="animate-pulse opacity-40" />
                  <p className="text-lg font-medium">Esperando a que los jugadores se unan...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {players.map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3 flex items-center space-x-3 shadow-md"
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/20"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.avatar}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-white text-base truncate">{p.name}</p>
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
          )}

          {/* Bottom Action */}
          <div className="pt-6 border-t border-slate-700/60 flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              {canStart ? '¡Todo listo para comenzar!' : 'Se necesitan al menos 2 jugadores'}
            </p>
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`flex items-center space-x-3 px-8 py-4 rounded-2xl text-xl font-bold font-game transition-all ${
                canStart
                  ? 'btn-game-yellow cursor-pointer hover:scale-105'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Play size={24} fill="currentColor" />
              <span>INICIAR PARTIDA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-slate-500 text-sm font-medium">
        Rondas configuradas: {gameState.settings.totalRounds} • Tiempo por turno: {gameState.settings.roundDuration}s • Jugadores máx: {gameState.settings.maxPlayers}
      </div>
    </div>
  );
};
