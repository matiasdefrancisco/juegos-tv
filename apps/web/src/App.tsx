import React, { useState, useEffect } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Home } from './views/Home';
import { TVHostView } from './views/TVHostView';
import { PlayerJoin } from './views/PlayerJoin';
import { PlayerGame } from './views/PlayerGame';

type CurrentView = 'home' | 'tv' | 'join' | 'play';

function AppContent() {
  const { player, gameCode } = useSocket();
  const [view, setView] = useState<CurrentView>('home');
  const [joinCodeParam, setJoinCodeParam] = useState<string>('');

  // Initial path detection
  useEffect(() => {
    const path = window.location.pathname;
    
    if (path.startsWith('/tv')) {
      setView('tv');
    } else if (path.startsWith('/join')) {
      const parts = path.split('/');
      if (parts[2]) {
        setJoinCodeParam(parts[2].toUpperCase());
      }
      setView('join');
    } else if (path.startsWith('/play')) {
      setView('play');
    }
  }, []);

  // When player joins, switch automatically to play controller
  useEffect(() => {
    if (player && view !== 'tv') {
      setView('play');
    }
  }, [player, view]);

  return (
    <>
      {view === 'home' && (
        <Home
          onNavigateToTV={() => setView('tv')}
          onNavigateToJoin={(code) => {
            if (code) setJoinCodeParam(code);
            setView('join');
          }}
        />
      )}

      {view === 'tv' && <TVHostView />}

      {view === 'join' && (
        <PlayerJoin
          initialCode={joinCodeParam}
          onJoined={() => setView('play')}
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
