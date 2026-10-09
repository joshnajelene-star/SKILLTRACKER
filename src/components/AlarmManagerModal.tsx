import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Volume2,
  Clock,
  X,
  Check,
  Play,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { StudyAlarm, Skill, AlarmSoundType } from '../types';
import { playSound } from '../utils/audio';

interface AlarmManagerModalProps {
  alarms: StudyAlarm[];
  skills: Skill[];
  darkMode: boolean;
  onClose: () => void;
  onSaveAlarm: (alarm: StudyAlarm) => void;
  onDeleteAlarm: (alarmId: string) => void;
  onToggleAlarm: (alarmId: string) => void;
  onTriggerTestAlarm: (alarm: StudyAlarm) => void;
}

export const AlarmManagerModal: React.FC<AlarmManagerModalProps> = ({
  alarms,
  skills,
  darkMode,
  onClose,
  onSaveAlarm,
  onDeleteAlarm,
  onToggleAlarm,
  onTriggerTestAlarm,
}) => {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('19:00');
  const [skillId, setSkillId] = useState<string>('');
  const [soundType, setSoundType] = useState<AlarmSoundType>('bell');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);

  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleRequestNotification = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const res = await Notification.requestPermission();
        setNotificationStatus(res);
      } catch (e) {
        console.warn('Notifications permission error', e);
      }
    }
  };

  const handleOpenCreate = () => {
    setTitle('Evening Study Session');
    setTime('19:00');
    setSkillId(skills[0]?.id || '');
    setSoundType('bell');
    setDaysOfWeek([1, 2, 3, 4, 5]);
    setIsCreating(true);
    setEditingId(null);
  };

  const handleOpenEdit = (alarm: StudyAlarm) => {
    setTitle(alarm.title);
    setTime(alarm.time);
    setSkillId(alarm.skillId || '');
    setSoundType(alarm.soundType);
    setDaysOfWeek(alarm.daysOfWeek);
    setEditingId(alarm.id);
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlarm: StudyAlarm = {
      id: editingId || `alarm-${Date.now()}`,
      title: title.trim() || 'Study Reminder',
      time,
      skillId: skillId || undefined,
      enabled: true,
      soundType,
      daysOfWeek,
    };
    onSaveAlarm(newAlarm);
    setIsCreating(false);
    setEditingId(null);
  };

  const toggleDay = (dayIndex: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-xl rounded-2xl p-6 sm:p-7 border shadow-2xl relative max-h-[90vh] flex flex-col justify-between overflow-hidden transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Study Alarm System</h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Schedule audio alarms and notifications to keep your streak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg text-slate-400 transition cursor-pointer ${
              darkMode ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="my-4 overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Notification permission banner */}
          {typeof Notification !== 'undefined' && notificationStatus !== 'granted' && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs gap-3 ${
                darkMode
                  ? 'bg-indigo-950/40 border-indigo-800/80 text-indigo-300'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>Enable browser popup notifications for alerts when tab is in background</span>
              </div>
              <button
                onClick={handleRequestNotification}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition cursor-pointer shrink-0"
              >
                Enable
              </button>
            </div>
          )}

          {/* Create or Edit Form */}
          {isCreating ? (
            <form onSubmit={handleSave} className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-indigo-400">
                  {editingId ? 'Edit Alarm' : 'New Study Alarm'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Alarm Title / Label</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JavaScript Coding Hour"
                  className={`w-full px-3 py-2 rounded-lg text-xs border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Alarm Time (24h)</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-mono tabular-nums border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Target Skill</label>
                  <select
                    value={skillId}
                    onChange={(e) => setSkillId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">General Study Session</option>
                    {skills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sound Type Selection with Preview */}
              <div>
                <label className="block text-xs font-medium mb-1">Alarm Sound Tone</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['bell', 'gentle', 'digital', 'marimba'] as AlarmSoundType[]).map((snd) => (
                    <div
                      key={snd}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                        soundType === snd
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : darkMode
                          ? 'border-slate-800 bg-slate-800/60 text-slate-400'
                          : 'border-slate-200 bg-slate-100 text-slate-700'
                      }`}
                      onClick={() => setSoundType(snd)}
                    >
                      <span className="capitalize">{snd}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound(snd);
                        }}
                        className="p-1 hover:text-indigo-400 text-slate-400"
                        title="Preview sound"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-xs font-medium mb-1.5">Repeat On</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {dayLabels.map((label, idx) => {
                    const active = daysOfWeek.includes(idx);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`w-9 h-8 rounded-lg text-xs font-medium transition cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white font-semibold'
                            : darkMode
                            ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                >
                  {editingId ? 'Update Alarm' : 'Set Alarm'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {alarms.length} Alarms configured
              </span>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Alarm</span>
              </button>
            </div>
          )}

          {/* Alarm List */}
          <div className="space-y-2.5">
            {alarms.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No study alarms set yet. Click "Add Alarm" to schedule your reminders!
              </div>
            ) : (
              alarms.map((alarm) => {
                const linkedSkill = skills.find((s) => s.id === alarm.skillId);
                return (
                  <div
                    key={alarm.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                      alarm.enabled
                        ? darkMode
                          ? 'bg-slate-800/60 border-slate-700/80'
                          : 'bg-white border-slate-200 shadow-xs'
                        : darkMode
                        ? 'bg-slate-900/40 border-slate-800/40 opacity-60'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleAlarm(alarm.id)}
                        className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                          alarm.enabled ? 'bg-amber-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            alarm.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold font-mono tabular-nums">
                            {alarm.time}
                          </span>
                          <span className="text-xs font-semibold truncate">
                            {alarm.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          {linkedSkill && (
                            <>
                              <span className="text-indigo-400 font-medium">{linkedSkill.name}</span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span className="capitalize">{alarm.soundType} tone</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {alarm.daysOfWeek.length === 7
                              ? 'Daily'
                              : alarm.daysOfWeek.map((d) => dayLabels[d]).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Test alarm trigger now button */}
                      <button
                        onClick={() => onTriggerTestAlarm(alarm)}
                        className="px-2 py-1 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition cursor-pointer"
                        title="Simulate this alarm ringing right now"
                      >
                        Test Ring 🔔
                      </button>
                      <button
                        onClick={() => handleOpenEdit(alarm)}
                        className="p-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                        title="Edit alarm"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteAlarm(alarm.id)}
                        className="p-1.5 text-xs text-slate-400 hover:text-rose-500 transition"
                        title="Delete alarm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Alarms will ring while this app is open in your browser</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
