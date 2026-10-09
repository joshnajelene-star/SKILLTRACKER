/**
 * Web Audio API synthesizer for study alarms and celebration chimes.
 * No external mp3 files required — works completely offline and instantly!
 */

import { AlarmSoundType } from '../types';

let audioCtx: AudioContext | null = null;
let currentAlarmInterval: number | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playChime(frequencies: number[], duration = 0.4, type: OscillatorType = 'sine', gainMultiplier = 0.25) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(gainMultiplier, now + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + duration + 0.05);
    });
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

/**
 * Play a single sequence for preview or single reminder
 */
export function playSound(soundType: AlarmSoundType) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (soundType) {
      case 'bell': {
        // High crystal bell chord
        [587.33, 880, 1174.66, 1760].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.18 / (i + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.7);
        });
        break;
      }

      case 'gentle': {
        // Warm meditative bowl chime
        [329.63, 493.88, 659.25, 987.77].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);

          gain.gain.setValueAtTime(0.001, now + i * 0.15);
          gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 1.8);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 1.9);
        });
        break;
      }

      case 'digital': {
        // Modern energetic arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);

          gain.gain.setValueAtTime(0.08, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.14);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.15);
        });
        break;
      }

      case 'marimba': {
        // Bright playful marimba notes
        const pattern = [440, 554.37, 659.25, 880, 659.25, 880];
        pattern.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.11);

          gain.gain.setValueAtTime(0.22, now + idx * 0.11);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.11);
          osc.stop(now + idx * 0.11 + 0.3);
        });
        break;
      }
    }
  } catch (err) {
    console.warn('Audio play error:', err);
  }
}

/**
 * Start a continuous ringing alarm loop until dismissed
 */
export function startRingingAlarm(soundType: AlarmSoundType) {
  stopRingingAlarm();
  playSound(soundType);

  currentAlarmInterval = window.setInterval(() => {
    playSound(soundType);
  }, 2400);
}

/**
 * Stop any active ringing alarm loop
 */
export function stopRingingAlarm() {
  if (currentAlarmInterval !== null) {
    clearInterval(currentAlarmInterval);
    currentAlarmInterval = null;
  }
}

/**
 * Play celebration fanfare when streak or milestone is achieved
 */
export function playSuccessChime() {
  playChime([523.25, 659.25, 783.99, 1046.5, 1318.51], 0.6, 'sine', 0.22);
}
