import React, { useState } from 'react';
import { Palette, Check, Sparkles, X, Sliders, RotateCcw } from 'lucide-react';
import { BG_THEMES, BgThemeId } from './ReactBitsBackground';

export interface ThemeSelectorPopoverProps {
  currentThemeId: BgThemeId;
  currentBgShade?: string;
  darkMode: boolean;
  onSelectTheme: (themeId: BgThemeId) => void;
  onSelectBgShade?: (shadeHex: string) => void;
  onResetShadeToDefault?: () => void;
  onClose: () => void;
}

const PRESET_SHADES = [
  { name: 'Deep Midnight', hex: '#080B14' },
  { name: 'Pitch Black', hex: '#000000' },
  { name: 'Slate Charcoal', hex: '#0F172A' },
  { name: 'Mystic Indigo', hex: '#0B0E23' },
  { name: 'Royal Violet', hex: '#120924' },
  { name: 'Dark Forest', hex: '#04140D' },
  { name: 'Ocean Deep', hex: '#041325' },
  { name: 'Warm Cocoa', hex: '#160A08' },
];

export const ThemeSelectorPopover: React.FC<ThemeSelectorPopoverProps> = ({
  currentThemeId,
  currentBgShade,
  darkMode,
  onSelectTheme,
  onSelectBgShade,
  onResetShadeToDefault,
  onClose,
}) => {
  const selectedTheme = BG_THEMES.find((t) => t.id === currentThemeId) || BG_THEMES[0];
  const activeShade = currentBgShade || (darkMode ? selectedTheme.darkBg : selectedTheme.lightBg);
  const [customHex, setCustomHex] = useState(activeShade);

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHex(val);
    if (onSelectBgShade) {
      onSelectBgShade(val);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl p-5 sm:p-6 border shadow-2xl relative max-h-[90vh] overflow-y-auto transition-all ${
          darkMode
            ? 'bg-slate-900/95 border-slate-800 text-white'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">ReactBits Background Styling</h3>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Customize Aurora colors and background shade
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: ReactBits Aurora Theme Palettes */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              1. Aurora Wave Themes
            </span>
            <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3" />
              <span>ReactBits.dev</span>
            </span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {BG_THEMES.map((theme) => {
              const isSelected = theme.id === currentThemeId;
              return (
                <button
                  key={theme.id}
                  onClick={() => onSelectTheme(theme.id)}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-3 transition text-left cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/15 ring-1 ring-indigo-500/30'
                      : darkMode
                      ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg shadow-xs shrink-0 flex items-center justify-center border border-white/20"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colorStops[0]}, ${theme.colorStops[1]}, ${theme.colorStops[2] || theme.colorStops[0]})`,
                      }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                    </div>

                    <div>
                      <span className="text-xs font-semibold block">{theme.name}</span>
                      <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {theme.colorStops.slice(0, 3).join(' · ')}
                      </span>
                    </div>
                  </div>

                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Custom Background Shade */}
        {onSelectBgShade && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>2. Customize Background Shade</span>
              </span>

              {currentBgShade && onResetShadeToDefault && (
                <button
                  onClick={onResetShadeToDefault}
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset shade</span>
                </button>
              )}
            </div>

            {/* Preset shade chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PRESET_SHADES.map((shade) => {
                const isShadeSelected = activeShade.toLowerCase() === shade.hex.toLowerCase();
                return (
                  <button
                    key={shade.name}
                    onClick={() => {
                      setCustomHex(shade.hex);
                      onSelectBgShade(shade.hex);
                    }}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                      isShadeSelected
                        ? 'border-indigo-500 ring-1 ring-indigo-500/40 bg-indigo-500/10'
                        : darkMode
                        ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: shade.hex }}
                    />
                    <span className="text-[10px] font-medium truncate">{shade.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={customHex}
                  onChange={handleCustomHexChange}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                />
                <div>
                  <span className="text-xs font-medium block">Custom Shade Hex</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{customHex}</span>
                </div>
              </div>
              <button
                onClick={() => onSelectBgShade(customHex)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Animation continues smoothly at 60 FPS</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg font-medium bg-slate-800 hover:bg-slate-750 text-white cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
