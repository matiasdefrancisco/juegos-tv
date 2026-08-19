import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Smartphone, Sparkles, Tv } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Screen, ScreenContent } from '../components/common/Screen';
import { useSocket } from '../context/SocketContext';

interface HomeProps {
  onNavigateToTV: () => void;
  onNavigateToJoin: (code?: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigateToTV, onNavigateToJoin }) => {
  const { createGame, resetSession, connected } = useSocket();
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const handleCreateGame = () => {
    // Descarta cualquier sala vieja guardada para que esta sea realmente nueva
    resetSession();
    createGame();
    onNavigateToTV();
  };

  const codeIsValid = joinCodeInput.trim().length >= 4;

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeIsValid) return;
    onNavigateToJoin(joinCodeInput.trim().toUpperCase());
  };

  return (
    <Screen header={<Header connected={connected} />}>
      <ScreenContent width="md">
        <div className="space-y-7 text-center py-2">
          {/* Presentación */}
          <div className="space-y-3">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-indigo-500/20 border border-amber-500/30 px-4 py-2 rounded-full text-amber-300 font-bold text-[11px] sm:text-sm shadow-xl"
            >
              <Sparkles size={15} className="flex-shrink-0" />
              <span>EL PARTY GAME DE DIBUJO Y ADIVINANZA</span>
            </motion.div>

            <h1 className="tv-title font-black font-game text-white tracking-tight">
              ¡Dibujá en tu celu,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400">
                adiviná en la TV!
              </span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
              Usá la pantalla de tu TV como pizarra central y conectá todos los celulares como
              controles en tiempo real.
            </p>
          </div>

          {/* Opciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Pantalla principal */}
            <motion.div
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.99 }}
              className="bg-slate-900/90 border-2 border-indigo-500/40 hover:border-indigo-400 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 text-left transition-colors"
            >
              <div className="space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Tv size={26} />
                </div>
                <h3 className="text-xl font-bold font-game text-white">Pantalla Principal</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Abrí esta opción en tu TV o computadora para generar el código QR y mostrar los
                  dibujos en grande.
                </p>
              </div>

              <button
                onClick={handleCreateGame}
                disabled={!connected}
                className={`mt-auto w-full flex items-center justify-center gap-2 text-base sm:text-lg py-3.5 rounded-2xl font-bold font-game transition-all ${
                  connected ? 'btn-game-primary' : 'btn-disabled'
                }`}
              >
                <span>{connected ? 'CREAR PARTIDA (TV)' : 'CONECTANDO...'}</span>
                <ArrowRight size={20} />
              </button>
            </motion.div>

            {/* Unirse */}
            <motion.div
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.99 }}
              className="bg-slate-900/90 border-2 border-pink-500/40 hover:border-pink-400 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 text-left transition-colors"
            >
              <div className="space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Smartphone size={26} />
                </div>
                <h3 className="text-xl font-bold font-game text-white">Entrar a Partida</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Unite con tu celular ingresando el código de 4 caracteres que se muestra en la
                  pantalla del televisor.
                </p>
              </div>

              <form onSubmit={handleJoinByCode} className="mt-auto space-y-2.5">
                <label htmlFor="home-code" className="sr-only">
                  Código de la sala
                </label>
                <input
                  id="home-code"
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) =>
                    setJoinCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                  }
                  placeholder="CÓDIGO (EJ: KP7R)"
                  maxLength={6}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-pink-500 text-white font-mono font-black text-center text-xl sm:text-2xl tracking-[0.25em] py-3 rounded-2xl outline-none uppercase shadow-inner placeholder:text-slate-600 placeholder:text-xs placeholder:font-sans placeholder:font-medium placeholder:tracking-normal"
                />
                <button
                  type="submit"
                  disabled={!codeIsValid}
                  className={`w-full py-3.5 rounded-2xl font-bold font-game text-base sm:text-lg transition-all ${
                    codeIsValid ? 'btn-game-accent' : 'btn-disabled'
                  }`}
                >
                  UNIRME DESDE EL CELULAR
                </button>
              </form>
            </motion.div>
          </div>

          <p className="text-slate-600 text-xs sm:text-sm font-medium safe-bottom">
            Party Draw © 2026 — Multijugador casual en tiempo real
          </p>
        </div>
      </ScreenContent>
    </Screen>
  );
};
