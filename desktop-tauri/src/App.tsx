import React, { useState, useEffect } from 'react';
import { ArcCoreHUD } from './components/ArcCoreHUD';
import { DesktopCommandCenter } from './components/DesktopCommandCenter';

export const App: React.FC = () => {
  // Check if window is spawned specifically for HUD or Command Center
  const [viewMode, setViewMode] = useState<'command-center' | 'hud'>('command-center');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'hud') {
      setViewMode('hud');
    }
  }, []);

  if (viewMode === 'hud') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100vw',
          height: '100vh',
          background: 'transparent',
        }}
      >
        <ArcCoreHUD onExpandCommandCenter={() => setViewMode('command-center')} />
      </div>
    );
  }

  return <DesktopCommandCenter onSwitchToHUD={() => setViewMode('hud')} />;
};

export default App;
