import { Camera, CameraOff } from 'lucide-react';
import { ScreenId } from '../types/hud';

interface TopBarProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  cameraActive: boolean;
  onToggleCamera: () => void;
}

const NAV_ITEMS: Array<{ id: ScreenId; label: string }> = [
  { id: 'vision', label: 'Live Vision' },
  { id: 'calibration', label: 'Calibration' },
  { id: 'pipeline', label: 'Neural Pipeline' },
  { id: 'sessions', label: 'Sessions' },
];

export function TopBar({
  activeScreen,
  onSelectScreen,
  cameraActive,
  onToggleCamera,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#0B1120]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:gap-8 sm:px-8">
        {/* Zone 1: Single-line Brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectScreen('vision')}
          className="text-left text-lg font-bold tracking-tight text-white transition-colors hover:text-[#86ecff] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#06D6F0] rounded"
        >
          Kinetix Spatial
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectScreen(item.id)}
                className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:text-[#06D6F0] ${
                  isActive
                    ? 'text-white'
                    : 'text-[#94A3B8] hover:text-[#dde2f8]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-[#2563EB] to-[#06D6F0] shadow-[0_0_12px_rgba(6,214,240,0.65)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleCamera}
            className="btn-cyber-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06D6F0]"
          >
            {cameraActive ? (
              <>
                <CameraOff className="h-4 w-4" aria-hidden="true" />
                <span>Stop Camera</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" aria-hidden="true" />
                <span>Start Camera</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        aria-label="Mobile navigation"
        className="flex md:hidden items-center gap-1 overflow-x-auto border-t border-white/[0.06] px-4 py-1.5"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectScreen(item.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#16233B] text-[#06D6F0] border border-[#06D6F0]/30'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
