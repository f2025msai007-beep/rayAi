import { LanguageOption, PresetScenario } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', name: 'Auto Detect', nativeName: 'Automatic', flag: '🌐', speechCode: 'en-US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', speechCode: 'it-IT' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文 (普通话)', flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', speechCode: 'ko-KR' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', speechCode: 'pt-BR' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', speechCode: 'ar-SA' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechCode: 'hi-IN' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', speechCode: 'ru-RU' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', speechCode: 'tr-TR' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', speechCode: 'nl-NL' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', speechCode: 'el-GR' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', speechCode: 'th-TH' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', speechCode: 'vi-VN' },
  { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸', speechCode: 'en-US' },
];

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'tokyo_cafe',
    title: 'Tokyo Specialty Café',
    location: 'Shibuya, Tokyo',
    sourceLang: 'ja',
    targetLang: 'en',
    description: 'Ordering artisanal pour-over coffee and asking about matcha sweets in Japanese.',
    turns: [
      {
        speaker: 'foreign_speaker',
        text: 'いらっしゃいませ！本日のおすすめは京都宇治産の抹茶ラテと手作りカヌレです。店内でお召し上がりですか？',
        delayMs: 1200,
      },
      {
        speaker: 'glasses_wearer',
        text: 'Yes, for here please. Could you make the matcha latte with oat milk and less sweet?',
        delayMs: 3500,
      },
      {
        speaker: 'foreign_speaker',
        text: 'かしこまりました。オーツミルク変更はプラス五十円になります。お会計はカードでよろしいですか？',
        delayMs: 2500,
      },
    ],
  },
  {
    id: 'barcelona_market',
    title: 'Mercat de la Boqueria',
    location: 'Barcelona, Spain',
    sourceLang: 'es',
    targetLang: 'en',
    description: 'Buying fresh jamón ibérico and seasonal fruits in a vibrant Spanish market.',
    turns: [
      {
        speaker: 'foreign_speaker',
        text: '¡Hola amigo! ¿Qué le pongo hoy? Tenemos un jamón de bellota curado durante cuatro años que está espectacular.',
        delayMs: 1200,
      },
      {
        speaker: 'glasses_wearer',
        text: 'That sounds fantastic. Could I get one hundred grams thinly sliced, and also some manchego cheese?',
        delayMs: 3200,
      },
      {
        speaker: 'foreign_speaker',
        text: '¡Por supuesto! Cortado a mano en el momento. ¿Desea probar una loncha para comprobar el punto de sal?',
        delayMs: 2600,
      },
    ],
  },
  {
    id: 'rome_train_station',
    title: 'Roma Termini Transit',
    location: 'Rome, Italy',
    sourceLang: 'it',
    targetLang: 'en',
    description: 'Asking the platform conductor about the high-speed Frecciarossa train to Florence.',
    turns: [
      {
        speaker: 'glasses_wearer',
        text: 'Excuse me conductor, does this Frecciarossa train stop at Firenze Santa Maria Novella?',
        delayMs: 1000,
      },
      {
        speaker: 'foreign_speaker',
        text: 'Sì signore, parte dal binario 8 tra dieci minuti e ferma proprio a Firenze Santa Maria Novella. Ha già convalidato il biglietto digitale?',
        delayMs: 2800,
      },
    ],
  },
  {
    id: 'paris_boulangerie',
    title: 'Parisian Boulangerie',
    location: 'Le Marais, Paris',
    sourceLang: 'fr',
    targetLang: 'en',
    description: 'Ordering fresh morning pastries and asking for walking directions to the Seine.',
    turns: [
      {
        speaker: 'foreign_speaker',
        text: 'Bonjour ! Les croissants au beurre sortent tout juste du four. Je vous sers également une baguette tradition ?',
        delayMs: 1200,
      },
      {
        speaker: 'glasses_wearer',
        text: 'Yes please, two croissants and a baguette. Also, which street leads directly down to the river?',
        delayMs: 3400,
      },
      {
        speaker: 'foreign_speaker',
        text: 'Prenez tout droit sur la rue Saint-Antoine, puis tournez à gauche au feu. Vous serez sur les quais en cinq minutes !',
        delayMs: 3000,
      },
    ],
  },
];
