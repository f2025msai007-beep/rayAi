import React, { useRef, useEffect } from 'react';
import { TranslationTurn, SpeakerRole } from '../types';
import {
  Glasses,
  User,
  Volume2,
  Sparkles,
  MessageSquare,
  Clock,
  Check,
  Radio,
  BookOpen,
  ArrowDown,
  Headphones
} from 'lucide-react';

interface Props {
  turns: TranslationTurn[];
  interimText: string;
  interimSpeaker: SpeakerRole;
  isListening: boolean;
  onPlayWhisper: (turn: TranslationTurn) => void;
  onSelectReply: (phrase: string, meaning: string) => void;
  activePlayingId: string | null;
}

export const SubtitleStream: React.FC<Props> = ({
  turns,
  interimText,
  interimSpeaker,
  isListening,
  onPlayWhisper,
  onSelectReply,
  activePlayingId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new turn or interim arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, interimText]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full overflow-y-auto space-y-4 px-1 py-2 sm:px-2"
    >
      {turns.length === 0 && !interimText && (
        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 space-y-4 text-slate-400">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 text-sky-400 shadow-xl shadow-sky-500/5">
              <Glasses className="w-8 h-8" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
              AI
            </span>
          </div>

          <div className="max-w-xs space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">
              Meta Ray-Ban Bridge Active
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Speak or listen to someone speaking a foreign language. Live subtitles and audio whisper sync in real time.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-3 py-1 border border-slate-800">
              <Radio className="w-3 h-3 text-sky-400" /> Bluetooth Sync
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-3 py-1 border border-slate-800">
              <Sparkles className="w-3 h-3 text-indigo-400" /> In-Ear Whisper
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-3 py-1 border border-slate-800">
              <BookOpen className="w-3 h-3 text-emerald-400" /> Live Subtitles
            </span>
          </div>
        </div>
      )}

      {/* Render Historical / Completed Turns */}
      {turns.map((turn) => {
        const isGlasses = turn.speaker === 'glasses_wearer';
        const isPlayingThis = activePlayingId === turn.id;

        return (
          <div
            key={turn.id}
            className={`w-full rounded-2xl border transition-all p-4 ${
              isGlasses
                ? 'bg-slate-900/70 border-sky-500/25 ml-auto'
                : 'bg-slate-900/90 border-slate-800 mr-auto'
            } shadow-md shadow-black/20`}
          >
            {/* Turn Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                    isGlasses
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {isGlasses ? (
                    <>
                      <Glasses className="w-3.5 h-3.5" />
                      <span>Ray-Ban Wearer</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5" />
                      <span>Foreign Speaker</span>
                    </>
                  )}
                </span>

                {turn.tone && (
                  <span className="text-[10px] text-slate-400 capitalize px-2 py-0.5 rounded-md bg-slate-950/60 border border-slate-800">
                    {turn.tone}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Original Spoken Text */}
            <div className="text-xs text-slate-300/85 font-mono mb-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">Original:</span>
              <p className="text-slate-200">{turn.originalText}</p>
            </div>

            {/* Live Subtitle Translation */}
            <div className="space-y-1 my-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">
                    {isGlasses ? 'Translation into Foreign Tongue' : 'Translation in Your Ear'}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    <Headphones className="w-2.5 h-2.5" />
                    Auto-Heard in Glasses
                  </span>
                </div>
                <button
                  onClick={() => onPlayWhisper(turn)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    isPlayingThis
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 animate-pulse'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  title="Whisper audio into Meta Ray-Ban temple speakers"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingThis ? 'animate-bounce text-white' : 'text-sky-400'}`} />
                  <span>{isPlayingThis ? 'Whispering in Glasses...' : 'Hear in Glasses'}</span>
                </button>
              </div>

              <p className="text-sm sm:text-base font-semibold text-slate-50 leading-relaxed tracking-tight">
                {turn.translatedText}
              </p>

              {/* Phonetic Pronunciation Guide */}
              {turn.phonetic && (
                <div className="text-[11px] font-mono text-indigo-300 bg-indigo-950/30 px-2.5 py-1 rounded-lg border border-indigo-500/20 inline-block mt-1">
                  🗣️ Phonetic: {turn.phonetic}
                </div>
              )}
            </div>

            {/* Cultural Note if present */}
            {turn.culturalNote && (
              <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                <span>{turn.culturalNote}</span>
              </div>
            )}

            {/* Suggested 1-Tap Replies */}
            {turn.suggestedReplies && turn.suggestedReplies.length > 0 && !isGlasses && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1.5 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-sky-400" />
                  Quick Reply Ideas (Tap to Speak):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {turn.suggestedReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectReply(reply.phrase, reply.meaning)}
                      className="group text-left rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs hover:border-sky-500/50 hover:bg-slate-900 transition active:scale-95"
                    >
                      <span className="font-semibold text-slate-200 group-hover:text-sky-300 block">
                        {reply.phrase}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {reply.meaning}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Real-Time Interim Subtitle Streaming (typing as speech is recognized) */}
      {interimText && (
        <div className="w-full rounded-2xl border border-sky-500/50 bg-slate-900/95 p-4 shadow-xl shadow-sky-500/10 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-sky-400">
              <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-ping" />
              <span>Transcribing live via Meta Ray-Ban mic...</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              Live Stream
            </span>
          </div>

          <div className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed font-sans">
            {interimText}
            <span className="inline-block w-2 h-4 ml-1 bg-sky-400 animate-pulse align-middle" />
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-2" />
    </div>
  );
};
