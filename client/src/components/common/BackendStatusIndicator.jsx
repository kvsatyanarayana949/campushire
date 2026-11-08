import React, { useState } from 'react';
import { useBackendStatus } from '../../context/BackendStatusContext';

const BackendStatusIndicator = () => {
  const { isReady } = useBackendStatus();
  const [showTooltip, setShowTooltip] = useState(false);

  const statusText = isReady ? 'Backend connected' : 'Backend connecting...';

  return (
    <div
      className="fixed bottom-3 right-3 z-50 flex items-center select-none"
      role="status"
      aria-live="polite"
      aria-label={statusText}
    >
      <div
        className="relative flex items-center justify-center p-1.5 cursor-pointer rounded-full transition-transform hover:scale-110"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip((prev) => !prev)}
        tabIndex={0}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {/* Circular Status Dot */}
        <span
          className={`block w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
            isReady
              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/60 ring-2 ring-emerald-400/30'
              : 'bg-rose-500 shadow-sm shadow-rose-500/60 ring-2 ring-rose-400/30 animate-pulse'
          }`}
        />

        {/* Accessible screen-reader label */}
        <span className="sr-only">{statusText}</span>

        {/* Hover / Focus Tooltip */}
        {showTooltip && (
          <div
            className="absolute bottom-full right-0 mb-2 px-2.5 py-1 text-[11px] font-medium tracking-tight text-white bg-slate-900/90 backdrop-blur-xs rounded-md shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200"
            role="tooltip"
          >
            <div className="flex items-center space-x-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isReady ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
                }`}
              />
              <span>{statusText}</span>
            </div>
            {/* Tooltip caret */}
            <div className="absolute top-full right-2 -mt-0.5 border-4 border-transparent border-t-slate-900/90" />
          </div>
        )}
      </div>
    </div>
  );
};

export default BackendStatusIndicator;
