import confetti from 'canvas-confetti';
import { playSuccessChime } from './audio';

/**
 * Triggers an energetic celebratory confetti animation when a student
 * completes their daily study goal for a skill.
 * Fires dual-side confetti cannons followed by a center celebratory burst.
 */
export function triggerGoalCompletedConfetti(skillName?: string) {
  try {
    // 1. Audio celebration fanfare
    playSuccessChime();

    // 2. Left side cannon
    confetti({
      particleCount: 65,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#38bdf8', '#ec4899', '#8b5cf6'],
      ticks: 250,
      gravity: 0.85,
    });

    // 3. Right side cannon
    confetti({
      particleCount: 65,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#38bdf8', '#ec4899', '#8b5cf6'],
      ticks: 250,
      gravity: 0.85,
    });

    // 4. Center fireworks burst
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 110,
        origin: { x: 0.5, y: 0.55 },
        colors: ['#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'],
        shapes: ['circle', 'square'],
        scalar: 1.15,
        ticks: 280,
      });
    }, 220);

    // 5. Final glittering shower
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 90,
        spread: 120,
        origin: { x: 0.5, y: 0.35 },
        gravity: 0.7,
        ticks: 300,
        scalar: 0.9,
      });
    }, 450);
  } catch (err) {
    console.warn('Confetti animation error:', err);
  }
}
