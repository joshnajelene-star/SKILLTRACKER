import React from 'react';
import {
  ReactBitsBackground,
  BgThemeId,
  BG_THEMES,
  BgTheme,
  ReactBitsBackgroundProps,
} from './ReactBitsBackground';

export { BG_THEMES } from './ReactBitsBackground';
export type { BgThemeId, BgTheme } from './ReactBitsBackground';

export interface AnimatedBackgroundProps {
  darkMode: boolean;
  themeId?: BgThemeId;
  customBgShade?: string;
  customColorStops?: string[];
  speed?: number;
  amplitude?: number;
  blend?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AnimatedBackground powered by ReactBits Aurora and Wave animation engine (reactbits.dev).
 * Supports dynamic CSS color theme variables and customizable background shades.
 * Uses .reactbit-animated-bg CSS class and --reactbit-bg-base / --reactbit-wave-color CSS variables,
 * allowing users to freely customize background shades while preserving smooth 60fps animation.
 */
export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  darkMode,
  themeId = 'cosmic-aurora',
  customBgShade,
  customColorStops,
  speed = 1.0,
  amplitude = 1.2,
  blend = 0.5,
  className,
  style,
}) => {
  return (
    <ReactBitsBackground
      darkMode={darkMode}
      themeId={themeId}
      customBgShade={customBgShade}
      customColorStops={customColorStops}
      speed={speed}
      amplitude={amplitude}
      blend={blend}
      className={className}
      style={style}
    />
  );
};
