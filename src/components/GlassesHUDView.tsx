import React, { useState } from 'react';
import { TranslationTurn, GlassesDeviceState } from '../types';
import {
  X,
  Maximize2,
  Minimize2,
  Type,
  Volume2,
  Glasses,
  Radio,
  Eye,
  Sliders,
  Headphones
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  turns: TranslationTurn[];
  interimText: string;
  deviceState: GlassesDeviceState;
  onPlayWhisper: (turn: TranslationTurn) => void;
}

export const GlassesHUDView: React.FC<Props> = ({
  isOpen,
  onClose,
  turns,
  interimText,
  deviceState,
  onPlayWhisper,
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [isMirrored, setIsMirrored] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  if (!isOpen) return null;

  const latestTurn = turns[turns.length - 1];

  const fontSizeClass = {
    normal: 'text-lg sm:text-2xl',
    large: 'text-2xl sm:text-4xl',
    huge: 'text-3xl sm:text-5xl',
  }[fontSize];

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col p-4 sm:p-8 select-none">
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Glasses className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-widest text-sky-400 uppercase">
                Meta Ray-Ban HUD
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/60">
              <span>+{deviceState.syncDelayMs}ms Sync</span>
              <span>·</span>
              <span className="flex items-center gap-1 text-sky-400 font-medium">
                <Headphones className="w-3 h-3" />
                {deviceState.autoHearMode === 'both'
                  ? 'Auto-Hear: Both Speakers'
                  : deviceState.autoHearMode === 'foreign_only'
                  ? 'Auto-Hear: Foreign Only'
                  : 'Auto-Hear: Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size Toggle */}
          <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/15">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded-lg text-xs font-mono ${fontSize === 'normal' ? 'bg-sky-500 text-white' : 'text-white/60'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold ${fontSize === 'large' ? 'bg-sky-500 text-white' : 'text-white/60'}`}
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('huge')}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-extrabold ${fontSize === 'huge' ? 'bg-sky-500 text-white' : 'text-white/60'}`}
            >
              A++
            </button>
          </div>

          {/* Mirror Toggle (for optical glass reflector displays) */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-2 rounded-xl border ${isMirrored ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white/10 text-white/70 border-white/15'}`}
            title="Mirror display horizontally for prism reflector lenses"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white border border-white/15"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Subtitle Display Stage */}
      <div
        className={`flex-1 flex flex-col justify-center items-center px-4 py-8 text-center transition-all ${
          isMirrored ? 'scale-x-[-1]' : ''
        }`}
      >
        {interimText ? (
          <div className="max-w-4xl space-y-4 animate-in fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-mono uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              Incoming Speech Stream
            </div>
            <p className={`font-semibold text-sky-200 tracking-tight leading-relaxed ${fontSizeClass}`}>
              {interimText}
              <span className="inline-block w-2.5 h-6 ml-2 bg-sky-400 animate-pulse align-middle" />
            </p>
          </div>
        ) : latestTurn ? (
          <div className="max-w-4xl space-y-5 animate-in fade-in">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono tracking-wider">
              {latestTurn.speaker === 'glasses_wearer' ? '👓 You (Glasses)' : '🗣️ Foreign Speaker'}
            </div>

            <p className={`font-bold text-white tracking-tight leading-snug ${fontSizeClass}`}>
              {latestTurn.translatedText}
            </p>

            {latestTurn.phonetic && (
              <p className="text-sm sm:text-lg font-mono text-sky-300/90 bg-white/5 py-1.5 px-4 rounded-2xl border border-white/10 inline-block">
                {latestTurn.phonetic}
              </p>
            )}

            <div className="text-xs sm:text-sm font-mono text-white/50 max-w-xl mx-auto pt-2">
              Original: "{latestTurn.originalText}"
            </div>

            <div className="pt-4">
              <button
                onClick={() => onPlayWhisper(latestTurn)}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 hover:bg-sky-400 px-5 py-2.5 text-xs font-bold text-white shadow-xl shadow-sky-500/20 transition active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                Whisper into Glasses Speakers
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-white/40 max-w-sm">
            <Radio className="w-12 h-12 mx-auto text-sky-400/50 animate-pulse" />
            <h3 className="text-lg font-semibold text-white/70">Awaiting Conversation</h3>
            <p className="text-xs">
              Microphone listening through Meta Ray-Ban audio channel. Live translated subtitles will project here in real-time.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs text-white/40 font-mono shrink-0">
        <span>OLED PWA Subtitle Projection</span>
        <span>Tap phone to whisper · Low latency Bluetooth</span>
      </div>
    </div>
  );
};
