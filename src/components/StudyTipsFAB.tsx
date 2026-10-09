import React, { useState, useEffect, useMemo } from 'react';
import {
  Lightbulb,
  Sparkles,
  Shuffle,
  X,
  Copy,
  Check,
  Star,
  Brain,
  Zap,
  Quote,
  Compass,
  ArrowRight
} from 'lucide-react';
import { STUDY_TIPS, StudyTip } from '../data/studyTips';

interface StudyTipsFABProps {
  darkMode: boolean;
}

export const StudyTipsFAB: React.FC<StudyTipsFABProps> = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTipIndex, setSelectedTipIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copied, setCopied] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('skilltracker_fav_study_tips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filtered tips based on category selection
  const filteredTips = useMemo(() => {
    if (selectedCategory === 'All') return STUDY_TIPS;
    if (selectedCategory === 'Favorites') {
      const favList = STUDY_TIPS.filter((t) => favorites.includes(t.id));
      return favList.length > 0 ? favList : STUDY_TIPS;
    }
    return STUDY_TIPS.filter((t) => t.category === selectedCategory);
  }, [selectedCategory, favorites]);

  // Current active tip
  const currentTip: StudyTip = filteredTips[selectedTipIndex % filteredTips.length] || STUDY_TIPS[0];

  // Pick a random tip
  const handleRandomize = () => {
    if (filteredTips.length <= 1) return;
    let nextIndex: number;
    do {
      nextIndex = Math.floor(Math.random() * filteredTips.length);
    } while (nextIndex === selectedTipIndex && filteredTips.length > 1);

    setSelectedTipIndex(nextIndex);
    setCopied(false);
  };

  // Open FAB modal with a fresh random tip
  const handleOpen = () => {
    const randomIndex = Math.floor(Math.random() * STUDY_TIPS.length);
    setSelectedCategory('All');
    setSelectedTipIndex(randomIndex);
    setCopied(false);
    setIsOpen(true);
  };

  // Toggle favorite tip
  const handleToggleFavorite = (tipId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(tipId);
      const updated = exists ? prev.filter((id) => id !== tipId) : [...prev, tipId];
      try {
        localStorage.setItem('skilltracker_fav_study_tips', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save favorites', e);
      }
      return updated;
    });
  };

  // Copy tip to clipboard
  const handleCopyTip = async () => {
    if (!currentTip) return;
    const textToCopy = `💡 ${currentTip.title} (${currentTip.technique})\n\n${currentTip.summary}\n\n⚡ Action: ${currentTip.actionStep}\n\n🧠 Why it works: ${currentTip.whyItWorks}${
      currentTip.quote ? `\n\n"${currentTip.quote}" — ${currentTip.author}` : ''
    }`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // Handle keyboard shortcuts (Esc to close, Space/R to randomize when open)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key.toLowerCase() === 'r' && !['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        handleRandomize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredTips, selectedTipIndex]);

  const isFavorite = currentTip ? favorites.includes(currentTip.id) : false;

  const categories = ['All', 'Focus & Deep Work', 'Memory & Retention', 'Productivity', 'Mindset & Motivation', 'Health & Energy', 'Favorites'];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          onClick={handleOpen}
          aria-label="Open Study Tips and Productivity Techniques"
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer border ${
            darkMode
              ? 'bg-slate-900/95 text-amber-300 border-amber-500/40 hover:border-amber-400 hover:shadow-amber-500/20 hover:bg-slate-800'
              : 'bg-white/95 text-amber-600 border-amber-300 hover:border-amber-400 hover:shadow-amber-500/15 hover:bg-amber-50/50'
          }`}
        >
          {/* Glowing pulse ring */}
          <span className="relative flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-30" />
            <Lightbulb className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300 fill-amber-400/20" />
          </span>

          <span className="text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
            <span>Study Tips</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 opacity-80 group-hover:opacity-100" />
          </span>
        </button>
      </div>

      {/* Interactive Modal / Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="study-tip-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-sm bg-black/60 transition-opacity animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className={`relative w-full max-w-xl rounded-3xl border shadow-2xl p-6 sm:p-7 overflow-hidden transition-all duration-300 transform scale-100 ${
              darkMode
                ? 'bg-slate-900/98 border-slate-700/80 text-white shadow-black/80'
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            {/* Ambient subtle backdrop glows */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Title, Controls, Close */}
            <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs border ${
                    darkMode
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-amber-100 border-amber-200 text-amber-600'
                  }`}
                >
                  <Lightbulb className="w-5 h-5 fill-amber-400/20" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider uppercase text-amber-500">
                      Productivity Spark
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      Tip {(selectedTipIndex % filteredTips.length) + 1} of {filteredTips.length}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold opacity-75">
                    Scientific Learning Techniques
                  </h3>
                </div>
              </div>

              {/* Action icons: Favorite, Copy, Close */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggleFavorite(currentTip.id)}
                  title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isFavorite
                      ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                      : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
                </button>

                <button
                  onClick={handleCopyTip}
                  title="Copy tip to clipboard"
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    copied
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  title="Close (Esc)"
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none no-scrollbar">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                const count = cat === 'All'
                  ? STUDY_TIPS.length
                  : cat === 'Favorites'
                  ? favorites.length
                  : STUDY_TIPS.filter((t) => t.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedTipIndex(0);
                      setCopied(false);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
                      isActive
                        ? darkMode
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-amber-500 text-white shadow-xs'
                        : darkMode
                        ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat} {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
                  </button>
                );
              })}
            </div>

            {/* Main Tip Body */}
            <div className="space-y-4 relative z-10">
              {/* Category & Technique Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${currentTip.badgeColor.bg} ${currentTip.badgeColor.text} ${currentTip.badgeColor.border}`}
                >
                  {currentTip.technique}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {currentTip.category}
                </span>
              </div>

              {/* Title */}
              <h2
                id="study-tip-title"
                className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {currentTip.title}
              </h2>

              {/* Summary */}
              <p
                className={`text-sm sm:text-base leading-relaxed ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {currentTip.summary}
              </p>

              {/* Action Step Box */}
              <div
                className={`rounded-2xl p-4 border transition-all ${
                  darkMode
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 font-bold text-xs uppercase tracking-wider text-emerald-500">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Try It Today (Action Step)</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">
                  {currentTip.actionStep}
                </p>
              </div>

              {/* Science & Why it works Box */}
              <div
                className={`rounded-2xl p-4 border ${
                  darkMode
                    ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-200'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 font-bold text-xs uppercase tracking-wider text-indigo-400">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Why This Works (Neuroscience)</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed opacity-95">
                  {currentTip.whyItWorks}
                </p>
              </div>

              {/* Inspirational Quote if available */}
              {currentTip.quote && (
                <div
                  className={`p-3.5 rounded-xl border italic text-xs flex items-start gap-2.5 ${
                    darkMode
                      ? 'bg-slate-800/40 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Quote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 opacity-80" />
                  <div>
                    <span>“{currentTip.quote}”</span>
                    {currentTip.author && (
                      <span className="block mt-1 font-semibold not-italic text-[11px] opacity-75">
                        — {currentTip.author}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Controls */}
            <div className="mt-6 pt-4 border-t border-slate-700/40 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono">R</kbd> for random
                </span>
                {copied && (
                  <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleRandomize}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 transition shadow-sm hover:shadow-amber-500/25 cursor-pointer active:scale-95"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Next Random Tip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
