import React from 'react';
import { WindowMinimise, WindowToggleMaximise, Quit } from '../../wailsjs/runtime/runtime';

// Icons
import { Minus, Square, X } from 'lucide-react';

function WindowControls() {
  const handleMinimize = () => {
    WindowMinimise();
  };

  const handleMaximize = () => {
    WindowToggleMaximise();
  };

  const handleClose = () => {
    Quit();
  };

  return (
    <div className="flex items-center space-x-1" style={{ WebkitAppRegion: 'no-drag' }}>
      <button
        onClick={handleMinimize}
        className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors"
        style={{ WebkitAppRegion: 'no-drag' }}
        title="最小化"
      >
        <Minus className="h-2 w-2 text-gray-800" strokeWidth={3} />
      </button>
      <button
        onClick={handleMaximize}
        className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
        style={{ WebkitAppRegion: 'no-drag' }}
        title="最大化"
      >
        <Square className="h-2 w-2 text-gray-800" strokeWidth={3} />
      </button>
      <button
        onClick={handleClose}
        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
        style={{ WebkitAppRegion: 'no-drag' }}
        title="关闭"
      >
        <X className="h-2 w-2 text-white" strokeWidth={3} />
      </button>
    </div>
  );
}

export default WindowControls;