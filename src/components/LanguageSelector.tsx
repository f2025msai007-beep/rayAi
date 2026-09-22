import React from 'react';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { TranslationStyle } from '../types';
import { ArrowLeftRight, Globe, Glasses, Users, Compass, SlidersHorizontal, Sparkles, Briefcase, BookOpen } from 'lucide-react';

interface Props {
  wearerLang: string;
  foreignLang: string;
  onWearerLangChange: (lang: string) => void;
  onForeignLangChange: (lang: string) => void;
  contextMode: string;
  onContextModeChange: (mode: string) => void;
  translationStyle: TranslationStyle;
  onTranslationStyleChange: (style: TranslationStyle) => void;
  onSwapLanguages: () => void;
}

export const LanguageSelector: React.FC<Props> = ({
  wearerLang,
  foreignLang,
  onWearerLangChange,
  onForeignLangChange,
  contextMode,
  onContextModeChange,
  translationStyle,
  onTranslationStyleChange,
  onSwapLanguages,
}) => {
  const styles: Array<{
    id: TranslationStyle;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'casual',
      label: 'Casual',
      description: 'Natural everyday idioms, relaxed pacing, colloquial phrasing',
      icon: Sparkles,
    },
    {
      id: 'professional',
      label: 'Professional',
      description: 'Polite honorifics, respectful tone, business-ready terminology',
      icon: Briefcase,
    },
    {
      id: 'literal',
      label: 'Literal',
      description: 'Direct word-by-word fidelity, exact syntax, minimal paraphrasing',
      icon: BookOpen,
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-3 sm:p-4 shadow-lg shadow-black/40 space-y-3">
      {/* Language Switcher Bar */}
      <div className="flex items-center gap-2">
        {/* Wearer Side */}
        <div className="flex-1 bg-slate-950/70 border border-slate-800/90 rounded-xl p-2.5 transition hover:border-slate-700">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-sky-400 mb-1">
            <Glasses className="w-3.5 h-3.5" />
            <span>My Language (Glasses)</span>
          </div>
          <select
            value={wearerLang}
            onChange={(e) => onWearerLangChange(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.filter((l) => l.code !== 'auto').map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
                {lang.flag} {lang.name} ({lang.nativeName})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <button
          onClick={onSwapLanguages}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white active:rotate-180 transition-all duration-300"
          title="Swap conversation languages"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        {/* Foreign Speaker Side */}
        <div className="flex-1 bg-slate-950/70 border border-slate-800/90 rounded-xl p-2.5 transition hover:border-slate-700">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Foreign Speaker</span>
          </div>
          <select
            value={foreignLang}
            onChange={(e) => onForeignLangChange(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
                {lang.flag} {lang.name} {lang.code !== 'auto' ? `(${lang.nativeName})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Translation Style Selection Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
          <span>Translation Style:</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
          {styles.map((style) => {
            const Icon = style.icon;
            const isSelected = translationStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => onTranslationStyleChange(style.id)}
                title={style.description}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                  isSelected
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm shadow-sky-500/20'
                    : 'bg-slate-950/50 text-slate-400 border border-slate-800/80 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3 h-3 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{style.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Context & Scenario Mode Quick Toggle */}
      <div className="flex flex-wrap items-center justify-between text-xs pt-1.5 border-t border-slate-800/60 gap-1.5">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Compass className="w-3.5 h-3.5 text-slate-400" />
          <span>Scenario:</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'casual', label: 'General / Travel' },
            { id: 'dining', label: 'Café & Dining' },
            { id: 'transit', label: 'Transit & Directions' },
            { id: 'business', label: 'Business' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => onContextModeChange(mode.id)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition whitespace-nowrap ${
                contextMode === mode.id
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
