import React, { useState, useEffect, useCallback } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Home } from './views/Home';
import { TVHostView } from './views/TVHostView';
import { PlayerJoin } from './views/PlayerJoin';
import { PlayerGame } from './views/PlayerGame';

type CurrentView = 'home' | 'tv' | 'join' | 'play';

interface Route {
  view: CurrentView;
  code: string;
}

/** Traduce la URL actual a una vista */
function readRoute(): Route {
  const path = window.location.pathname;

  if (path.startsWith('/tv')) return { view: 'tv', code: '' };
  if (path.startsWith('/play')) return { view: 'play', code: '' };
  if (path.startsWith('/join')) {
    const parts = path.split('/');
    return { view: 'join', code: (parts[2] || '').toUpperCase() };
  }
  return { view: 'home', code: '' };
}

function pathFor(view: CurrentView, code?: string): string {
  switch (view) {
    case 'tv':
      return '/tv';
    case 'play':
      return '/play';
    case 'join':
      return code ? `/join/${code}` : '/join';
    default:
      return '/';
  }
}

function AppContent() {
  const { player } = useSocket();
  const initial = readRoute();
  const [view, setView] = useState<CurrentView>(initial.view);
  const [joinCodeParam, setJoinCodeParam] = useState<string>(initial.code);

  /** Cambia de vista y deja la URL en sintonía, para que atrás/adelante funcionen */
  const navigate = useCallback((next: CurrentView, code?: string) => {
    if (code) setJoinCodeParam(code);
    setView(next);

    const target = pathFor(next, code);
    if (window.location.pathname !== target) {
      window.history.pushState({ view: next, code }, '', target);
    }
  }, []);

  // Botones atrás/adelante del navegador
  useEffect(() => {
    const handlePopState = () => {
      const route = readRoute();
      setView(route.view);
      if (route.code) setJoinCodeParam(route.code);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Si esta pantalla ya es una TV con sala guardada, va directo al tablero
  useEffect(() => {
    if (view === 'home' && localStorage.getItem('party_draw_role') === 'tv' && localStorage.getItem('party_draw_code')) {
      navigate('tv');
    }
  }, [view, navigate]);

  // Con jugador activo, el celular siempre muestra el controlador
  useEffect(() => {
    if (player && view !== 'tv' && view !== 'play') {
      navigate('play');
    }
  }, [player, view, navigate]);

  return (
    <>
      {view === 'home' && (
        <Home
          onNavigateToTV={() => navigate('tv')}
          onNavigateToJoin={(code) => navigate('join', code)}
        />
      )}

      {view === 'tv' && <TVHostView />}

      {view === 'join' && (
        <PlayerJoin
          initialCode={joinCodeParam}
          onJoined={() => navigate('play')}
          onBack={() => navigate('home')}
        />
      )}

      {view === 'play' && <PlayerGame />}
    </>
  );
}

export function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}

export default App;
