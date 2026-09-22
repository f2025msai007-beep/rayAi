import React, { useState, useEffect, useRef } from 'react';
import {
  TranslationTurn,
  GlassesDeviceState,
  SpeakerRole,
  PresetScenario,
  TranslationStyle
} from './types';
import { SUPPORTED_LANGUAGES } from './data/languages';
import { audioEngine } from './services/audioEngine';
import { speechService } from './services/speechService';
import { Header } from './components/Header';
import { LanguageSelector } from './components/LanguageSelector';
import { SubtitleStream } from './components/SubtitleStream';
import { ConversationControls } from './components/ConversationControls';
import { BluetoothManagerModal } from './components/BluetoothManagerModal';
import { GlassesHUDView } from './components/GlassesHUDView';
import { ConversationSummaryModal } from './components/ConversationSummaryModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Device & Meta Ray-Ban Smart Glasses state
  const [deviceState, setDeviceState] = useState<GlassesDeviceState>(() => {
    const defaultState: GlassesDeviceState = {
      connected: true,
      deviceName: 'Ray-Ban Meta Wayfarer',
      model: 'Wayfarer (Matte Black)',
      batteryLevel: 92,
      isCharging: false,
      wearState: 'on_head',
      connectionType: 'system_bluetooth',
      syncDelayMs: 120, // 120ms default Bluetooth audio latency compensation
      whisperVolume: 85,
      micGain: 80,
      micInputLevel: 0,
      cameraLedActive: false,
      autoHearMode: 'both', // Automatically hear translated versions of BOTH speakers in glasses
    };

    const saved = localStorage.getItem('rayban_device_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          autoHearMode: parsed.autoHearMode || 'both',
        };
      } catch (e) {}
    }
    return defaultState;
  });

  // Language settings
  const [wearerLang, setWearerLang] = useState('en');
  const [foreignLang, setForeignLang] = useState('es');
  const [contextMode, setContextMode] = useState('casual');
  const [translationStyle, setTranslationStyle] = useState<TranslationStyle>(() => {
    const saved = localStorage.getItem('rayban_translation_style');
    return (saved === 'professional' || saved === 'literal' || saved === 'casual') ? saved : 'casual';
  });

  // Conversation turns
  const [turns, setTurns] = useState<TranslationTurn[]>(() => {
    const saved = localStorage.getItem('rayban_turns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Initial welcome turn for instant delight
    return [
      {
        id: 'turn-welcome',
        timestamp: Date.now() - 30000,
        speaker: 'foreign_speaker',
        originalText: '¡Hola! Bienvenido a Barcelona. ¿Cómo puedo ayudarte hoy?',
        sourceLang: 'es',
        targetLang: 'en',
        translatedText: 'Hello! Welcome to Barcelona. How can I help you today?',
        whisperText: 'Hello! Welcome to Barcelona. How can I help?',
        phonetic: 'OH-lah! bee-en-veh-NEE-doh ah bar-seh-LOH-nah...',
        tone: 'friendly',
        culturalNote: 'Friendly Catalan greeting often heard when arriving in Barcelona markets and cafés.',
        suggestedReplies: [
          { phrase: '¿Dónde está la estación de metro más cercana?', meaning: 'Where is the nearest metro station?' },
          { phrase: 'Busco un buen lugar para comer tapas.', meaning: 'I am looking for a good tapas place.' },
        ],
        audioSynced: true,
      },
    ];
  });

  // Speech & Recognition state
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [activeSpeaker, setActiveSpeaker] = useState<SpeakerRole>('foreign_speaker');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Modals & Views
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);
  const [isHUDOpen, setIsHUDOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Persist state
  useEffect(() => {
    localStorage.setItem('rayban_device_state', JSON.stringify(deviceState));
  }, [deviceState]);

  useEffect(() => {
    localStorage.setItem('rayban_turns', JSON.stringify(turns));
  }, [turns]);

  useEffect(() => {
    localStorage.setItem('rayban_translation_style', translationStyle);
  }, [translationStyle]);

  // AudioContext unlock on first user gesture
  useEffect(() => {
    const handleGesture = () => {
      audioEngine.unlock();
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
    window.addEventListener('click', handleGesture);
    window.addEventListener('touchstart', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  const handleUpdateDeviceState = (updates: Partial<GlassesDeviceState>) => {
    setDeviceState((prev) => ({ ...prev, ...updates }));
  };

  const handleSwapLanguages = () => {
    const prevWearer = wearerLang;
    const prevForeign = foreignLang;
    setWearerLang(prevForeign === 'auto' ? 'es' : prevForeign);
    setForeignLang(prevWearer);
    audioEngine.playCue('haptic_tap');
  };

  // Perform translation call and trigger audio whisper
  const processTranslation = async (text: string, speaker: SpeakerRole) => {
    const sourceCode = speaker === 'glasses_wearer' ? wearerLang : foreignLang;
    const targetCode = speaker === 'glasses_wearer' ? foreignLang : wearerLang;

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang: sourceCode,
          targetLang: targetCode,
          speakerRole: speaker,
          conversationHistory: turns.slice(-4),
          conversationContext: contextMode,
          translationStyle,
        }),
      });

      const data = await response.json();

      const newTurn: TranslationTurn = {
        id: `turn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        speaker,
        originalText: text,
        sourceLang: data.detectedSourceLang || sourceCode,
        targetLang: targetCode,
        translatedText: data.translatedText || text,
        whisperText: data.whisper || data.translatedText || text,
        phonetic: data.phonetic,
        tone: data.tone,
        culturalNote: data.culturalNote,
        suggestedReplies: data.suggestedReplies,
        audioSynced: true,
      };

      setTurns((prev) => [...prev, newTurn]);

      // Automatically whisper into glasses based on autoHearMode
      const shouldAutoHear =
        deviceState.autoHearMode === 'both' ||
        (deviceState.autoHearMode === 'foreign_only' && speaker === 'foreign_speaker') ||
        (deviceState.autoHearMode === 'wearer_only' && speaker === 'glasses_wearer');

      if (shouldAutoHear) {
        playWhisperInGlasses(newTurn, false);
      }
    } catch (err: any) {
      console.error('Translation network failure:', err);
      // Fallback local turn
      const fallbackTurn: TranslationTurn = {
        id: `turn-${Date.now()}`,
        timestamp: Date.now(),
        speaker,
        originalText: text,
        sourceLang: sourceCode,
        targetLang: targetCode,
        translatedText: text,
        whisperText: text,
      };
      setTurns((prev) => [...prev, fallbackTurn]);
      const shouldAutoHearFallback =
        deviceState.autoHearMode === 'both' ||
        (deviceState.autoHearMode === 'foreign_only' && speaker === 'foreign_speaker') ||
        (deviceState.autoHearMode === 'wearer_only' && speaker === 'glasses_wearer');
      if (shouldAutoHearFallback) {
        playWhisperInGlasses(fallbackTurn, false);
      }
    }
  };

  // Whisper audio into the Meta Ray-Ban temple speakers
  const playWhisperInGlasses = async (turn: TranslationTurn, interrupt = false) => {
    setActivePlayingId(turn.id);
    audioEngine.playCue('whisper_start');

    const textToSpeak = turn.whisperText || turn.translatedText;
    const langCode = turn.targetLang === 'auto' ? 'en' : turn.targetLang;

    try {
      // First attempt Gemini TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voice: 'Zephyr',
          language: langCode,
        }),
      });

      const data = await response.json();

      if (data.success && data.audio) {
        await audioEngine.playGeminiPcm(
          data.audio,
          data.sampleRate || 24000,
          deviceState.whisperVolume / 100,
          deviceState.syncDelayMs
        );
      } else {
        // Fallback to high-reliability browser speech synthesis
        const matched = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
        await audioEngine.speakFallback(
          textToSpeak,
          matched?.speechCode || 'en-US',
          deviceState.whisperVolume / 100,
          deviceState.syncDelayMs,
          interrupt
        );
      }
    } catch (e) {
      // Fallback with correct target language code
      const matched = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
      await audioEngine.speakFallback(
        textToSpeak,
        matched?.speechCode || 'en-US',
        deviceState.whisperVolume / 100,
        deviceState.syncDelayMs,
        interrupt
      );
    } finally {
      setActivePlayingId(null);
    }
  };

  // Toggle speech recognition
  const handleToggleListening = async () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      setInterimText('');
      audioEngine.detachMic();
    } else {
      audioEngine.playCue('mic_open');
      const currentCode = activeSpeaker === 'glasses_wearer' ? wearerLang : foreignLang;
      const matched = SUPPORTED_LANGUAGES.find((l) => l.code === currentCode);
      const speechCode = matched?.speechCode || 'en-US';

      const started = await speechService.startListening(
        speechCode,
        (text, isFinal) => {
          if (isFinal) {
            setInterimText('');
            processTranslation(text, activeSpeaker);
          } else {
            setInterimText(text);
          }
        },
        (error) => {
          console.warn('Speech error:', error);
        }
      );

      if (started) {
        setIsListening(true);
        const stream = speechService.getActiveStream();
        if (stream) {
          audioEngine.attachMicStream(stream);
        }
      }
    }
  };

  // Stop simulation runner
  const handleStopSimulation = () => {
    simulationTimeouts.current.forEach((t) => clearTimeout(t));
    simulationTimeouts.current = [];
    setIsSimulating(false);
    setInterimText('');
  };

  // Run a scenario simulation
  const handleLoadScenario = (scenario: PresetScenario) => {
    handleStopSimulation();
    setIsSimulating(true);

    setWearerLang(scenario.targetLang);
    setForeignLang(scenario.sourceLang);

    audioEngine.playCue('connect');

    let accumulatedDelay = 500;
    scenario.turns.forEach((turn, idx) => {
      accumulatedDelay += turn.delayMs;

      // Typing effect simulation
      const typingTimeout = setTimeout(() => {
        setInterimText(turn.text.slice(0, Math.floor(turn.text.length * 0.6)) + '...');
      }, accumulatedDelay - 600);

      // Final speech commit
      const finalTimeout = setTimeout(() => {
        setInterimText('');
        processTranslation(turn.text, turn.speaker);
        if (idx === scenario.turns.length - 1) {
          setIsSimulating(false);
        }
      }, accumulatedDelay);

      simulationTimeouts.current.push(typingTimeout, finalTimeout);
    });
  };

  const handleSelectSuggestedReply = (phrase: string, meaning: string) => {
    audioEngine.playCue('haptic_tap');
    // Wearer taps reply to speak back in foreign tongue
    processTranslation(phrase, 'glasses_wearer');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header with Meta Ray-Ban status, HUD, and Install button */}
      <Header
        deviceState={deviceState}
        onOpenBluetoothModal={() => setIsBluetoothModalOpen(true)}
        onOpenHUD={() => setIsHUDOpen(true)}
      />

      {/* Main Interactive Stage */}
      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col px-3 py-2 sm:px-4 overflow-hidden">
        {/* Language Switcher & Context Bar */}
        <LanguageSelector
          wearerLang={wearerLang}
          foreignLang={foreignLang}
          onWearerLangChange={setWearerLang}
          onForeignLangChange={setForeignLang}
          contextMode={contextMode}
          onContextModeChange={setContextMode}
          translationStyle={translationStyle}
          onTranslationStyleChange={(style) => {
            setTranslationStyle(style);
            audioEngine.playCue('haptic_tap');
          }}
          onSwapLanguages={handleSwapLanguages}
        />

        {/* Live Subtitle Stream */}
        <SubtitleStream
          turns={turns}
          interimText={interimText}
          interimSpeaker={activeSpeaker}
          isListening={isListening}
          onPlayWhisper={playWhisperInGlasses}
          onSelectReply={handleSelectSuggestedReply}
          activePlayingId={activePlayingId}
        />

        {/* Bottom Conversation Controls (Big Mic, Speaker Selector, Manual Input) */}
        <ConversationControls
          isListening={isListening}
          onToggleListening={handleToggleListening}
          activeSpeaker={activeSpeaker}
          onChangeActiveSpeaker={setActiveSpeaker}
          onManualTranslate={(text, speaker) => processTranslation(text, speaker)}
          onLoadScenario={handleLoadScenario}
          onClearConversation={() => setTurns([])}
          onOpenExport={() => setIsExportModalOpen(true)}
          isSimulating={isSimulating}
          onStopSimulation={handleStopSimulation}
          autoHearMode={deviceState.autoHearMode}
          onChangeAutoHearMode={(mode) => {
            handleUpdateDeviceState({ autoHearMode: mode });
            audioEngine.playCue('haptic_tap');
          }}
        />
      </main>

      {/* Bluetooth & Meta Ray-Ban Device Manager Modal */}
      <BluetoothManagerModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        deviceState={deviceState}
        onUpdateDeviceState={handleUpdateDeviceState}
      />

      {/* Fullscreen OLED Teleprompter / HUD View */}
      <GlassesHUDView
        isOpen={isHUDOpen}
        onClose={() => setIsHUDOpen(false)}
        turns={turns}
        interimText={interimText}
        deviceState={deviceState}
        onPlayWhisper={playWhisperInGlasses}
      />

      {/* Conversation Export / Markdown Summary Modal */}
      <ConversationSummaryModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        turns={turns}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
