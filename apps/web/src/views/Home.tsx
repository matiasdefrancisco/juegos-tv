import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tv, Smartphone, Sparkles, ArrowRight, Gamepad2 } from 'lucide-react';
import { Header } from '../components/common/Header';
import { useSocket } from '../context/SocketContext';

interface HomeProps {
  onNavigateToTV: () => void;
  onNavigateToJoin: (code?: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigateToTV, onNavigateToJoin }) => {
  const { createGame } = useSocket();
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const handleCreateGame = () => {
    createGame();
    onNavigateToTV();
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    onNavigateToJoin(joinCodeInput.trim().toUpperCase());
  };

  return (
    <div className="min-h-[100dvh] party-bg-ambient flex flex-col justify-between select-none">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full text-center space-y-8 sm:space-y-10 my-auto">
        {/* Hero Section */}
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-indigo-500/20 border border-amber-500/30 px-5 py-2 rounded-full text-amber-300 font-bold text-xs sm:text-sm shadow-xl"
          >
            <Sparkles size={16} />
            <span>EL PARTY GAME DE DIBUJO Y ADIVINANZA</span>
          </motion.div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-game text-white tracking-tight leading-tight">
            ¡Dibujá en tu celu,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400 drop-shadow-md">
              adiviná en la TV!
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Usá la pantalla de tu TV como pizarra central y conectá todos los celulares como controles en tiempo real.
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full max-w-2xl">
          {/* Option 1: TV / Host Screen */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900/90 border-2 border-indigo-500/40 hover:border-indigo-400 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-6 text-left relative overflow-hidden group transition-all"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <Tv size={32} />
              </div>
              <h3 className="text-2xl font-bold font-game text-white">Pantalla Principal</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Abrí esta opción en tu TV o computadora para generar el código QR y mostrar los dibujos en grande.
              </p>
            </div>

            <button
              onClick={handleCreateGame}
              className="btn-game-primary w-full flex items-center justify-center space-x-2 text-lg py-3.5"
            >
              <span>CREAR PARTIDA (TV)</span>
              <ArrowRight size={20} />
            </button>
          </motion.div>

          {/* Option 2: Mobile Player Join */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-slate-900/90 border-2 border-pink-500/40 hover:border-pink-400 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-6 text-left transition-all"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-inner">
                <Smartphone size={32} />
              </div>
              <h3 className="text-2xl font-bold font-game text-white">Entrar a Partida</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Unite con tu celular ingresando el código de 4 dígitos que se muestra en la pantalla del televisor.
              </p>
            </div>

            <form onSubmit={handleJoinByCode} className="space-y-3">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="CÓDIGO (EJ: 4827)"
                maxLength={6}
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-pink-500 text-white font-mono font-black text-center text-2xl tracking-widest py-3 rounded-2xl outline-none uppercase shadow-inner placeholder:text-slate-600 placeholder:text-sm placeholder:font-sans placeholder:font-medium"
              />
              <button
                type="submit"
                disabled={!joinCodeInput.trim()}
                className={`w-full py-3.5 rounded-2xl font-bold font-game text-lg transition-all ${
                  joinCodeInput.trim()
                    ? 'btn-game-accent cursor-pointer'
                    : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                UNIRME DESDE EL CELULAR
              </button>
            </form>
          </motion.div>
        </div>
      </main>

      <footer className="p-4 text-center text-slate-600 text-xs sm:text-sm font-medium safe-bottom">
        Party Draw © 2026 — Multijugador casual en tiempo real
      </footer>
    </div>
  );
};
