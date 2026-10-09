import React, { useEffect, useRef } from 'react';

export type BgThemeId =
  | 'cosmic-aurora'
  | 'neon-nebula'
  | 'emerald-zen'
  | 'sunset-mirage'
  | 'cyber-noir'
  | 'amethyst-dream'
  | 'ocean-abyss';

export interface BgTheme {
  id: BgThemeId;
  name: string;
  darkBg: string;
  lightBg: string;
  colorStops: string[];
  accentColor: string;
}

export const BG_THEMES: BgTheme[] = [
  {
    id: 'cosmic-aurora',
    name: 'Cosmic Aurora (Deep Indigo & Cyan)',
    darkBg: '#080B14',
    lightBg: '#F0F4F8',
    colorStops: ['#4F46E5', '#06B6D4', '#10B981', '#3B82F6'],
    accentColor: '#06B6D4',
  },
  {
    id: 'neon-nebula',
    name: 'Neon Nebula (Royal Violet & Fuchsia)',
    darkBg: '#0B0716',
    lightBg: '#FAF5FF',
    colorStops: ['#8B5CF6', '#EC4899', '#3B82F6', '#D946EF'],
    accentColor: '#EC4899',
  },
  {
    id: 'emerald-zen',
    name: 'Emerald Zen (Mystic Forest & Mint)',
    darkBg: '#04120C',
    lightBg: '#F0FDF4',
    colorStops: ['#059669', '#10B981', '#34D399', '#0D9488'],
    accentColor: '#10B981',
  },
  {
    id: 'sunset-mirage',
    name: 'Sunset Mirage (Amber & Coral Dusk)',
    darkBg: '#140A09',
    lightBg: '#FFF7ED',
    colorStops: ['#EA580C', '#F59E0B', '#E11D48', '#FB923C'],
    accentColor: '#F59E0B',
  },
  {
    id: 'cyber-noir',
    name: 'Cyber Noir (Obsidian & Steel Blue)',
    darkBg: '#030712',
    lightBg: '#F8FAFC',
    colorStops: ['#1E293B', '#38BDF8', '#475569', '#0EA5E9'],
    accentColor: '#38BDF8',
  },
  {
    id: 'amethyst-dream',
    name: 'Amethyst Dream (Celestial Violet & Pulse)',
    darkBg: '#100826',
    lightBg: '#FAF5FF',
    colorStops: ['#7C3AED', '#A855F7', '#C084FC', '#6366F1'],
    accentColor: '#A855F7',
  },
  {
    id: 'ocean-abyss',
    name: 'Ocean Abyss (Midnight Sapphire & Aqua)',
    darkBg: '#041325',
    lightBg: '#F0F9FF',
    colorStops: ['#0284C7', '#06B6D4', '#38BDF8', '#0EA5E9'],
    accentColor: '#38BDF8',
  },
];

export interface ReactBitsBackgroundProps {
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
 * ReactBits Aurora Background component
 * Implements 60fps ribbon wave physics and customizable color theme variables.
 */
export const ReactBitsBackground: React.FC<ReactBitsBackgroundProps> = ({
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeTheme = BG_THEMES.find((t) => t.id === themeId) || BG_THEMES[0];
  const effectiveBgShade = customBgShade || (darkMode ? activeTheme.darkBg : activeTheme.lightBg);
  const activeColorStops =
    customColorStops && customColorStops.length > 0 ? customColorStops : activeTheme.colorStops;

  const mousePosRef = useRef({ x: 0.5, y: 0.5 });

  // Track mouse for subtle interactive wave deflection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ReactBits Aurora 60fps Canvas Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Wave layers specification
    const waves = [
      { baseFreq: 0.0018, speed: 0.008, phase: 0, heightRatio: 0.35, colorIdx: 0, ampMult: 1.0 },
      { baseFreq: 0.0022, speed: 0.012, phase: 1.8, heightRatio: 0.48, colorIdx: 1, ampMult: 1.2 },
      { baseFreq: 0.0015, speed: 0.006, phase: 3.4, heightRatio: 0.62, colorIdx: 2, ampMult: 0.85 },
      { baseFreq: 0.0028, speed: 0.014, phase: 5.1, heightRatio: 0.75, colorIdx: 3, ampMult: 1.1 },
    ];

    const render = () => {
      time += 0.016 * speed;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 1. Draw solid backdrop color (using custom shade or theme default)
      ctx.fillStyle = effectiveBgShade;
      ctx.fillRect(0, 0, width, height);

      // 2. Set compositing mode for rich Aurora ribbon blending
      ctx.globalCompositeOperation = darkMode ? 'screen' : 'source-over';

      const mouse = mousePosRef.current;
      const mouseOffsetX = (mouse.x - 0.5) * 40;
      const mouseOffsetY = (mouse.y - 0.5) * 30;

      // 3. Render organic waving ribbons
      waves.forEach((wave, idx) => {
        const color = activeColorStops[wave.colorIdx % activeColorStops.length];
        const centerY = height * wave.heightRatio + mouseOffsetY * (idx % 2 === 0 ? 1 : -1);
        const waveAmp = 50 * amplitude * wave.ampMult;

        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, centerY);

        const step = 28;
        for (let x = 0; x <= width + step; x += step) {
          const xProgress = x * wave.baseFreq;
          const y =
            centerY +
            Math.sin(xProgress + time * wave.speed * 60 + wave.phase) * waveAmp +
            Math.sin(xProgress * 2.2 - time * 0.4 + mouseOffsetX * 0.02) * (waveAmp * 0.45) +
            Math.cos(xProgress * 0.7 + time * 0.25) * (waveAmp * 0.3);

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Soft vertical gradient for the wave
        const gradient = ctx.createLinearGradient(0, centerY - waveAmp, 0, height);
        const alpha = darkMode ? (idx === 1 ? 0.38 : 0.28) * blend : (idx === 1 ? 0.16 : 0.11) * blend;

        // Parse hex to rgba
        let r = 79, g = 70, b = 229;
        if (color.startsWith('#') && color.length >= 7) {
          r = parseInt(color.slice(1, 3), 16) || 0;
          g = parseInt(color.slice(3, 5), 16) || 0;
          b = parseInt(color.slice(5, 7), 16) || 0;
        }

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // 4. Ambient light blooms
      const bloomX = width * (0.3 + Math.sin(time * 0.3) * 0.2);
      const bloomY = height * (0.35 + Math.cos(time * 0.25) * 0.15);
      const bloomGrad = ctx.createRadialGradient(bloomX, bloomY, 20, bloomX, bloomY, width * 0.45);

      const bloomColor = activeColorStops[0];
      let br = 79, bg = 70, bb = 229;
      if (bloomColor.startsWith('#') && bloomColor.length >= 7) {
        br = parseInt(bloomColor.slice(1, 3), 16) || 0;
        bg = parseInt(bloomColor.slice(3, 5), 16) || 0;
        bb = parseInt(bloomColor.slice(5, 7), 16) || 0;
      }
      const bloomAlpha = darkMode ? 0.2 : 0.07;

      bloomGrad.addColorStop(0, `rgba(${br}, ${bg}, ${bb}, ${bloomAlpha})`);
      bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = bloomGrad;
      ctx.fillRect(0, 0, width, height);

      // Reset compositing
      ctx.globalCompositeOperation = 'source-over';

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [darkMode, activeTheme, effectiveBgShade, activeColorStops, speed, amplitude, blend]);

  return (
    <div
      className={`reactbit-animated-bg ${className || ''}`}
      style={{
        '--reactbit-bg-base': effectiveBgShade,
        '--reactbit-wave-color-1': activeColorStops[0] || '#4F46E5',
        '--reactbit-wave-color-2': activeColorStops[1] || '#06B6D4',
        '--reactbit-wave-color-3': activeColorStops[2] || '#10B981',
        '--reactbit-wave-color-4': activeColorStops[3] || '#3B82F6',
        '--reactbit-accent': activeTheme.accentColor,
        ...style,
      } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* 60fps Aurora Waves Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="reactbit-canvas-layer"
      />

      {/* Subtle ReactBits Dot Grid Mesh overlay */}
      <div
        className={`reactbit-grid-overlay ${darkMode ? 'invert-0' : 'invert'}`}
      />

      {/* Ambient radial glow overlay */}
      <div className="reactbit-glow-overlay" />

      {/* Subtle floating starlight micro-particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span
          className="absolute top-[18%] left-[15%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse-subtle"
        />
        <span
          className="absolute top-[38%] right-[22%] w-2 h-2 rounded-full bg-white/30 animate-float-slow"
          style={{ animationDelay: '2.5s' }}
        />
        <span
          className="absolute top-[68%] left-[28%] w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse-subtle"
          style={{ animationDelay: '4.5s' }}
        />
        <span
          className="absolute top-[52%] right-[35%] w-2 h-2 rounded-full bg-white/30 animate-float-slow"
          style={{ animationDelay: '7s' }}
        />
      </div>
    </div>
  );
};
