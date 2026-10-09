import { useEffect, useRef } from 'react';
import { StudyAlarm, Skill } from '../types';

interface UseAlarmWatcherOptions {
  alarms: StudyAlarm[];
  skills: Skill[];
  onTriggerAlarm: (alarm: StudyAlarm) => void;
}

export function useAlarmWatcher({ alarms, skills, onTriggerAlarm }: UseAlarmWatcherOptions) {
  // Keep track of the last minute we fired an alarm to avoid duplicate triggers
  const lastFiredMinuteRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const currentDayOfWeek = now.getDay(); // 0 is Sunday
      const nowTimestamp = now.getTime();

      alarms.forEach((alarm) => {
        if (!alarm.enabled) return;

        // Check snooze
        if (alarm.snoozedUntil && nowTimestamp < alarm.snoozedUntil) {
          return;
        }

        const isTimeMatch = alarm.time === currentTimeStr;
        const isDayMatch = alarm.daysOfWeek.includes(currentDayOfWeek);
        const lastFiredKey = `${alarm.id}_${now.toDateString()}_${currentTimeStr}`;

        // Also check if snoozedUntil just expired
        const snoozeExpired =
          alarm.snoozedUntil &&
          nowTimestamp >= alarm.snoozedUntil &&
          nowTimestamp - alarm.snoozedUntil < 60000;

        if ((isTimeMatch && isDayMatch) || snoozeExpired) {
          if (!lastFiredMinuteRef.current[lastFiredKey]) {
            lastFiredMinuteRef.current[lastFiredKey] = currentTimeStr;

            // Trigger in-app modal
            onTriggerAlarm(alarm);

            // Trigger system browser notification if allowed
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              try {
                const linkedSkill = skills.find((s) => s.id === alarm.skillId);
                const skillText = linkedSkill ? ` for ${linkedSkill.name}` : '';
                new Notification(`⏰ SkillTracker Alarm: ${alarm.title}`, {
                  body: `Time for your study session${skillText}! Keep your streak alive 🔥`,
                  icon: '/favicon.ico',
                });
              } catch (e) {
                console.warn('Could not show system notification', e);
              }
            }
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alarms, skills, onTriggerAlarm]);
}
