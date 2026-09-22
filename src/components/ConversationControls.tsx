import React, { useState } from 'react';
import { SpeakerRole, PresetScenario, AutoHearMode } from '../types';
import { PRESET_SCENARIOS } from '../data/languages';
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  Send,
  Trash2,
  Share2,
  PlayCircle,
  PauseCircle,
  Glasses,
  User,
  ChevronDown,
  Headphones,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Props {
  isListening: boolean;
  onToggleListening: () => void;
  activeSpeaker: SpeakerRole;
  onChangeActiveSpeaker: (speaker: SpeakerRole) => void;
  onManualTranslate: (text: string, speaker: SpeakerRole) => void;
  onLoadScenario: (scenario: PresetScenario) => void;
  onClearConversation: () => void;
  onOpenExport: () => void;
  isSimulating: boolean;
  onStopSimulation: () => void;
  autoHearMode: AutoHearMode;
  onChangeAutoHearMode: (mode: AutoHearMode) => void;
}

export const ConversationControls: React.FC<Props> = ({
  isListening,
  onToggleListening,
  activeSpeaker,
  onChangeActiveSpeaker,
  onManualTranslate,
  onLoadScenario,
  onClearConversation,
  onOpenExport,
  isSimulating,
  onStopSimulation,
  autoHearMode,
  onChangeAutoHearMode,
}) => {
  const [manualInput, setManualInput] = useState('');
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onManualTranslate(manualInput.trim(), activeSpeaker);
    setManualInput('');
  };

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-3 sm:p-4 shadow-2xl shadow-black/60 space-y-3">
      {/* Upper Control Strip: Speaker Mode, Auto-Hear in Glasses, & Quick Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Speaker Selector Toggle */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 text-xs shrink-0">
          <button
            onClick={() => onChangeActiveSpeaker('foreign_speaker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition ${
              activeSpeaker === 'foreign_speaker'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Foreign Speaker</span>
          </button>
          <button
            onClick={() => onChangeActiveSpeaker('glasses_wearer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition ${
              activeSpeaker === 'glasses_wearer'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Glasses className="w-3.5 h-3.5" />
            <span>I'm Speaking (Glasses)</span>
          </button>
        </div>

        {/* Auto-Hear in Glasses Pill Selector */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 text-xs">
          <span className="hidden md:flex items-center gap-1 pl-2 pr-1 text-[11px] font-semibold text-slate-400">
            <Headphones className="w-3.5 h-3.5 text-sky-400" />
            <span>Hear in Glasses:</span>
          </span>
          <button
            onClick={() => onChangeAutoHearMode('both')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold transition ${
              autoHearMode === 'both'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Automatically whisper translated speech of BOTH speakers into your Meta Ray-Ban glasses"
          >
            <Headphones className="w-3.5 h-3.5 md:hidden text-sky-300" />
            <span>Both</span>
            {autoHearMode === 'both' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
          <button
            onClick={() => onChangeAutoHearMode('foreign_only')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl font-semibold transition ${
              autoHearMode === 'foreign_only'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Only whisper the foreign speaker translated into your language"
          >
            <span>Foreign Only</span>
          </button>
          <button
            onClick={() => onChangeAutoHearMode('off')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl font-semibold transition ${
              autoHearMode === 'off'
                ? 'bg-slate-800 text-slate-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mute auto-hear (manual tap to listen)"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Tools (Simulation & Clear/Export) */}
        <div className="flex items-center gap-1.5">
          {/* Preset Scenario Simulator */}
          <div className="relative">
            <button
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 text-xs font-medium"
              title="Test realistic travel conversations"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Simulate</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showScenarioMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-64 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-40 text-xs space-y-1">
                <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  Pre-configured Test Scenarios
                </div>
                {PRESET_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      setShowScenarioMenu(false);
                      onLoadScenario(scenario);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-800 transition group flex flex-col"
                  >
                    <div className="font-semibold text-slate-200 group-hover:text-sky-300 flex items-center justify-between">
                      <span>{scenario.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{scenario.sourceLang.toUpperCase()}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{scenario.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onOpenExport}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition"
            title="Export / Share Conversation Transcript"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClearConversation}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-rose-400 hover:border-slate-700 transition"
            title="Clear Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Action Bar: Big Mic Button & Manual Type Bar */}
      <div className="flex items-center gap-2">
        {/* Big Mic Button */}
        <button
          onClick={isSimulating ? onStopSimulation : onToggleListening}
          className={`flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white transition-all shadow-xl active:scale-95 shrink-0 ${
            isListening || isSimulating
              ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25 animate-pulse'
              : 'bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-600 hover:opacity-95 shadow-sky-500/25'
          }`}
        >
          {isSimulating ? (
            <>
              <PauseCircle className="w-5 h-5 text-white animate-spin" />
              <span>Stop Simulation</span>
            </>
          ) : isListening ? (
            <>
              <MicOff className="w-5 h-5 text-white" />
              <span>Pause Mic</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 text-white" />
              <span>Start Live Translate</span>
            </>
          )}
        </button>

        {/* Manual Input Field (For noisy areas or quick typed phrases) */}
        <form onSubmit={handleSubmitManual} className="flex-1 flex items-center gap-1.5">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={`Or type spoken text in ${activeSpeaker === 'glasses_wearer' ? 'your language' : 'foreign language'}...`}
            className="w-full rounded-2xl bg-slate-950/80 border border-slate-800 px-3.5 py-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="p-3 rounded-2xl bg-slate-800 text-slate-300 hover:bg-sky-500 hover:text-white transition disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-300"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
