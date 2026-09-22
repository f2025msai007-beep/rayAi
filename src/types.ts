export type SpeakerRole = 'glasses_wearer' | 'foreign_speaker';

export interface TranslationTurn {
  id: string;
  timestamp: number;
  speaker: SpeakerRole;
  originalText: string;
  sourceLang: string;
  targetLang: string;
  translatedText: string;
  whisperText: string;
  phonetic?: string;
  tone?: string;
  culturalNote?: string;
  suggestedReplies?: Array<{
    phrase: string;
    meaning: string;
  }>;
  audioSynced?: boolean;
  isPlayingAudio?: boolean;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
  ttsVoice?: string;
}

export type GlassesModel = 'Wayfarer (Matte Black)' | 'Wayfarer (Shiny Black)' | 'Headliner (Caramel)' | 'Skyler (Shiny Chalk)';

export type AutoHearMode = 'both' | 'foreign_only' | 'wearer_only' | 'off';

export interface GlassesDeviceState {
  connected: boolean;
  deviceName: string;
  model: GlassesModel;
  batteryLevel: number;
  isCharging: boolean;
  wearState: 'on_head' | 'off_head' | 'in_case';
  connectionType: 'web_bluetooth' | 'system_bluetooth' | 'simulated';
  syncDelayMs: number; // Bluetooth audio latency compensation (e.g. 120ms)
  whisperVolume: number; // 0 to 100%
  micGain: number; // 0 to 100%
  activeAudioDeviceLabel?: string;
  micInputLevel: number; // 0 to 100 real-time VU
  cameraLedActive: boolean;
  autoHearMode: AutoHearMode; // 'both' | 'foreign_only' | 'wearer_only' | 'off'
}

export type DisplayMode = 'mobile_feed' | 'ar_hud' | 'teleprompter' | 'compact_dock';

export type TranslationStyle = 'casual' | 'professional' | 'literal';

export interface PresetScenario {
  id: string;
  title: string;
  location: string;
  sourceLang: string;
  targetLang: string;
  description: string;
  turns: Array<{
    speaker: SpeakerRole;
    text: string;
    delayMs: number;
  }>;
}
