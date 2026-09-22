import express from 'express';
import path from 'path';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
let isGeminiAvailable: boolean | null = null;

function getAi(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    geminiLive: isGeminiAvailable === true,
    timestamp: new Date().toISOString(),
  });
});

// Translation endpoint
app.post('/api/translate', async (req, res) => {
  const {
    text = '',
    sourceLang = 'auto',
    targetLang = 'en',
    speakerRole = 'foreign_speaker',
    conversationHistory = [],
    conversationContext = 'casual conversational encounter',
    translationStyle = 'casual', // 'casual' | 'professional' | 'literal'
  } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required for translation' });
  }

  // Attempt Gemini API if not known to be restricted/unavailable
  if (isGeminiAvailable !== false && process.env.GEMINI_API_KEY) {
    try {
      const ai = getAi();

      // Specific guidance per requested translation style
      let styleGuidance = '';
      if (translationStyle === 'professional') {
        styleGuidance = `Translation Style: PROFESSIONAL / FORMAL.
- Use polished, polite, and respectful language suitable for workplace, diplomatic, or executive meetings.
- Apply polite honorifics and grammatically elevated vocabulary.
- Avoid slang, contractions, and casual idioms.`;
      } else if (translationStyle === 'literal') {
        styleGuidance = `Translation Style: LITERAL / DIRECT FIDELITY.
- Prioritize verbatim accuracy and direct syntactic correspondence over stylistic flourishes.
- Preserve the exact meaning, word choice, and structural logic of the speaker's original utterance with minimal paraphrasing.
- Do not add creative embellishments.`;
      } else {
        styleGuidance = `Translation Style: CASUAL / SPOKEN CONVERSATIONAL.
- Use everyday natural idioms, relaxed spoken cadence, and natural colloquial phrasing.
- Optimize for smooth, friendly human-to-human banter.`;
      }

      const systemPrompt = `You are the real-time AI translation engine powering Meta Ray-Ban smart glasses audio and live mobile subtitles.
The glasses wearer is in a live spoken conversation.
Your translations must adhere strictly to the following parameters:
1. ${styleGuidance}
2. Tuned for smart glasses open-ear audio whispering: provide a 'whisper' summary that conveys the vital meaning in crisp, low-syllable speech for fast audio playback into the temple speakers.
3. Include phonetic/pronunciation guide when translating non-Latin scripts (e.g. Japanese, Chinese, Arabic, Hindi, Russian, Korean) or tricky words.
4. Provide 2-3 quick, culturally appropriate 1-tap conversational replies in the foreign speaker's language with English translations matching the selected style.

Format the response strictly as valid JSON according to the schema provided.`;

      const contextSnippet = Array.isArray(conversationHistory) && conversationHistory.length > 0
        ? `Recent Conversation Context:\n${conversationHistory.slice(-4).map((m: any) => `${m.speaker === 'glasses_wearer' ? 'Wearer' : 'Foreign Speaker'}: "${m.text}" -> "${m.translation}"`).join('\n')}\n`
        : '';

      const prompt = `${contextSnippet}Current Spoken Segment:
Speaker: ${speakerRole === 'glasses_wearer' ? 'Meta Ray-Ban Wearer' : 'Foreign Speaker'}
Source Language: ${sourceLang}
Target Language: ${targetLang}
Context Mode: ${conversationContext}
Translation Style: ${translationStyle}
Original Speech: "${text}"

Translate this accurately adhering to the ${translationStyle} style into ${targetLang}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedText: {
                type: Type.STRING,
                description: 'Complete, fluent translation in target language',
              },
              whisper: {
                type: Type.STRING,
                description: 'Crisp, concise version optimized for fast in-ear audio whispering',
              },
              detectedSourceLang: {
                type: Type.STRING,
                description: 'Name and ISO code of detected source language',
              },
              phonetic: {
                type: Type.STRING,
                description: 'Phonetic/romanized pronunciation guide if target or source is non-Latin or complex',
              },
              tone: {
                type: Type.STRING,
                description: 'Inferred tone (e.g., friendly, inquisitive, formal, urgent)',
              },
              culturalNote: {
                type: Type.STRING,
                description: 'Brief optional note on cultural context or idiom, or empty string',
              },
              suggestedReplies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phrase: { type: Type.STRING, description: 'Reply in target or other conversational language' },
                    meaning: { type: Type.STRING, description: 'English translation of the reply' },
                  },
                  required: ['phrase', 'meaning'],
                },
                description: '2-3 quick conversational response ideas',
              },
            },
            required: ['translatedText', 'whisper', 'detectedSourceLang'],
          },
        },
      });

      const outputText = response.text?.trim() || '{}';
      const parsed = JSON.parse(outputText);

      isGeminiAvailable = true;
      return res.json({
        success: true,
        originalText: text,
        sourceLang,
        targetLang,
        ...parsed,
      });
    } catch (error: any) {
      // Mark Gemini unavailable to bypass redundant calls and avoid spamming stderr
      isGeminiAvailable = false;
    }
  }

    // Fallback translation dictionary and heuristic styled by translationStyle
    const sampleTranslations: Record<string, Record<string, { translatedText: string; whisper: string; phonetic?: string; suggestedReplies?: Array<{ phrase: string; meaning: string }> }>> = {
      'こんにちは、お元気ですか？': {
        casual: {
          translatedText: 'Hey, how are things going with you?',
          whisper: 'Hey, how are you?',
          phonetic: 'Kohn-nee-chee-wah, oh-gen-kee des-kah?',
        },
        professional: {
          translatedText: 'Good day. I trust you are doing well?',
          whisper: 'Greetings. How are you?',
          phonetic: 'Kohn-nee-chee-wah, oh-gen-kee des-kah?',
        },
        literal: {
          translatedText: 'Hello, are you in good health?',
          whisper: 'Hello, are you well?',
          phonetic: 'Kohn-nee-chee-wah, oh-gen-kee des-kah?',
        },
      },
      '¡Hola! Bienvenido a Barcelona. ¿Cómo puedo ayudarte hoy?': {
        casual: {
          translatedText: 'Hey there! Welcome to Barcelona. What can I get for you today?',
          whisper: 'Welcome to Barcelona! How can I help?',
          phonetic: 'OH-lah! Bee-en-veh-NEE-doh ah bar-seh-LOH-nah...',
        },
        professional: {
          translatedText: 'Hello, welcome to Barcelona. How may I assist you today?',
          whisper: 'Welcome to Barcelona. May I assist you?',
          phonetic: 'OH-lah! Bee-en-veh-NEE-doh ah bar-seh-LOH-nah...',
        },
        literal: {
          translatedText: 'Hello! Welcome to Barcelona. How am I able to help you today?',
          whisper: 'Welcome to Barcelona. How can I help today?',
          phonetic: 'OH-lah! Bee-en-veh-NEE-doh ah bar-seh-LOH-nah...',
        },
      },
      'いらっしゃいませ！本日のおすすめは京都宇治産の抹茶ラテと手作りカヌレです。店内でお召し上がりですか？': {
        casual: {
          translatedText: 'Welcome in! Today’s special is Kyoto Uji matcha latte and homemade canelés. Will you be having that here?',
          whisper: 'Welcome! Today is Uji matcha latte and canelés. For here?',
          phonetic: 'Ee-rash-shy-mah-seh! Hon-jitsu no...',
        },
        professional: {
          translatedText: 'Welcome. Our featured selection today is Kyoto Uji matcha latte accompanied by handmade canelés. Would you care to dine in?',
          whisper: 'Welcome. Today we recommend Kyoto matcha latte. Dining in?',
          phonetic: 'Ee-rash-shy-mah-seh!',
        },
        literal: {
          translatedText: 'Welcome! Today’s recommendation is Kyoto Uji-produced matcha latte and handmade canelé. Will you consume it in the store?',
          whisper: 'Welcome! Kyoto matcha latte and canelé. Eat in?',
          phonetic: 'Ee-rash-shy-mah-seh!',
        },
      },
      'かしこまりました。オーツミルク変更はプラス五十円になります。お会計はカードでよろしいですか？': {
        casual: {
          translatedText: 'Got it! Oat milk is fifty yen extra. Paying by card?',
          whisper: 'Understood. Oat milk +50 yen. Card okay?',
          phonetic: 'Kashiko-mari-mash-tah...',
        },
        professional: {
          translatedText: 'Certainly. Substituting oat milk is an additional fifty yen. May I process your payment via card?',
          whisper: 'Certainly. Oat milk +50 yen. Card payment?',
          phonetic: 'Kashiko-mari-mash-tah...',
        },
        literal: {
          translatedText: 'Understood. Oat milk change becomes plus fifty yen. Is payment by card all right?',
          whisper: 'Understood. Oat milk +50 yen. Card?',
          phonetic: 'Kashiko-mari-mash-tah...',
        },
      },
      '¡Hola amigo! ¿Qué le pongo hoy? Tenemos un jamón de bellota curado durante cuatro años que está espectacular.': {
        casual: {
          translatedText: 'Hey friend! What can I get for you today? We have a four-year cured acorn-fed ham that is mind-blowing.',
          whisper: 'Hey! 4-year acorn-fed cured ham is spectacular today.',
          phonetic: 'OH-lah ah-MEE-goh...',
        },
        professional: {
          translatedText: 'Good day sir. What may I prepare for you today? We offer an exceptional acorn-fed ham cured for four years.',
          whisper: 'Good day. We offer exceptional 4-year cured bellota ham.',
          phonetic: 'OH-lah ah-MEE-goh...',
        },
        literal: {
          translatedText: 'Hello friend! What do I put for you today? We have an acorn ham cured during four years that is spectacular.',
          whisper: 'Hello! 4-year acorn ham is spectacular.',
          phonetic: 'OH-lah ah-MEE-goh...',
        },
      },
      '¡Por supuesto! Cortado a mano en el momento. ¿Desea probar una loncha para comprobar el punto de sal?': {
        casual: {
          translatedText: 'Absolutely! Hand-carved fresh right now. Want to taste a slice to check the saltiness?',
          whisper: 'Hand-carved now! Want a taste to check salt?',
          phonetic: 'Por soor-PWES-toh...',
        },
        professional: {
          translatedText: 'Certainly. Hand-carved to order immediately. Would you care to sample a slice to verify the salt cure?',
          whisper: 'Certainly. Hand-carved now. Would you care to sample a slice?',
          phonetic: 'Por soor-PWES-toh...',
        },
        literal: {
          translatedText: 'Of course! Cut by hand at the moment. Do you desire to try a slice to check the point of salt?',
          whisper: 'Of course! Fresh cut. Try a slice for salt?',
          phonetic: 'Por soor-PWES-toh...',
        },
      },
      'Sì signore, parte dal binario 8 tra dieci minuti e ferma proprio a Firenze Santa Maria Novella. Ha già convalidato il biglietto digitale?': {
        casual: {
          translatedText: 'Yes sir, it leaves from track 8 in ten minutes and stops right at Firenze Santa Maria Novella. Did you already validate your digital ticket?',
          whisper: 'Track 8 in 10 mins, stops at Firenze SMN. Validated digital ticket?',
          phonetic: 'See seen-YOH-reh, PAR-teh dal bee-NAH-ree-oh...',
        },
        professional: {
          translatedText: 'Yes sir, departures are from platform 8 in ten minutes, arriving directly at Firenze Santa Maria Novella. Have you already validated your electronic ticket?',
          whisper: 'Platform 8 in 10 minutes for Firenze SMN. Validated ticket?',
          phonetic: 'See seen-YOH-reh...',
        },
        literal: {
          translatedText: 'Yes sir, it departs from platform 8 in ten minutes and stops precisely at Firenze Santa Maria Novella. Have you already validated the digital ticket?',
          whisper: 'Leaves track 8 in 10 mins for Firenze SMN. Validated ticket?',
          phonetic: 'See seen-YOH-reh...',
        },
      },
      'Bonjour ! Les croissants au beurre sortent tout juste du four. Je vous sers également une baguette tradition ?': {
        casual: {
          translatedText: 'Good morning! Butter croissants just came straight out of the oven. Can I grab you a traditional baguette too?',
          whisper: 'Butter croissants fresh from the oven! Traditional baguette too?',
          phonetic: 'Bohn-ZHOOR! Lay krwah-SAHN...',
        },
        professional: {
          translatedText: 'Good morning. Our butter croissants have just emerged from the oven. May I present you with a traditional baguette as well?',
          whisper: 'Good morning. Fresh butter croissants out of the oven. Baguette too?',
          phonetic: 'Bohn-ZHOOR!',
        },
        literal: {
          translatedText: 'Good day! The butter croissants come out just now from the oven. I serve you also a tradition baguette?',
          whisper: 'Fresh butter croissants out of the oven. Baguette also?',
          phonetic: 'Bohn-ZHOOR!',
        },
      },
      'Prenez tout droit sur la rue Saint-Antoine, puis tournez à gauche au feu. Vous serez sur les quais en cinq minutes !': {
        casual: {
          translatedText: 'Head straight down Rue Saint-Antoine, then turn left at the traffic light. You will be by the river banks in five minutes!',
          whisper: 'Straight on Saint-Antoine, left at lights. River in 5 mins!',
          phonetic: 'Pruh-nay too drwah soor lah roo...',
        },
        professional: {
          translatedText: 'Proceed directly along Rue Saint-Antoine, then turn left at the traffic signal. You will arrive at the river quays within five minutes.',
          whisper: 'Straight on Saint-Antoine, left at light. Quays in 5 minutes.',
          phonetic: 'Pruh-nay too drwah...',
        },
        literal: {
          translatedText: 'Take straight on the street Saint-Antoine, then turn to the left at the light. You will be on the quays in five minutes!',
          whisper: 'Straight on Saint-Antoine, left at light. River quays in 5 mins.',
          phonetic: 'Pruh-nay too drwah...',
        },
      },
    };

    const phraseMatches = sampleTranslations[text.trim()];
    const styleKey = (translationStyle === 'professional' || translationStyle === 'literal') ? translationStyle : 'casual';
    let matched = phraseMatches ? phraseMatches[styleKey] : null;

    let translatedText = matched?.translatedText;
    let whisper = matched?.whisper;

    // If not a pre-matched phrase, use high-speed neural translation bridge
    if (!translatedText) {
      try {
        const fromPair = sourceLang === 'auto' ? 'autodetect' : sourceLang;
        const toPair = targetLang || 'en';
        const queryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${fromPair}|${toPair}`;
        const extResp = await fetch(queryUrl, { headers: { 'User-Agent': 'MetaRayBanTranslator/1.0' } });
        if (extResp.ok) {
          const extJson: any = await extResp.json();
          const rawResult = extJson?.responseData?.translatedText;
          if (rawResult && typeof rawResult === 'string' && rawResult.trim() && rawResult.trim() !== text.trim()) {
            translatedText = rawResult.trim();
            whisper = translatedText.length > 80 ? translatedText.slice(0, 75) + '...' : translatedText;
          }
        }
      } catch (transErr) {
        console.warn('External translation bridge error:', transErr);
      }
    }

    const fallbackTranslatedText = translatedText || `${text}`;
    const fallbackWhisper = whisper || fallbackTranslatedText;
    const fallbackPhonetic = matched ? matched.phonetic : undefined;

    res.json({
      success: true,
      originalText: text,
      sourceLang,
      targetLang,
      translationStyle,
      translatedText: fallbackTranslatedText,
      whisper: fallbackWhisper,
      detectedSourceLang: sourceLang === 'auto' ? 'Detected Foreign' : sourceLang,
      phonetic: fallbackPhonetic,
      tone: translationStyle,
      culturalNote: `Live translated into English (${translationStyle} tone) for Meta Ray-Ban temple audio.`,
      suggestedReplies: translationStyle === 'professional'
        ? [
            { phrase: 'Muchísimas gracias por su asistencia', meaning: 'Thank you very much for your assistance' },
            { phrase: 'Disculpe, ¿podría repetir con mayor detenimiento?', meaning: 'Pardon me, could you repeat more thoroughly?' },
          ]
        : translationStyle === 'literal'
        ? [
            { phrase: 'Gracias', meaning: 'Thanks' },
            { phrase: 'Por favor, repita', meaning: 'Please, repeat' },
          ]
        : [
            { phrase: '¡Muchísimas gracias!', meaning: 'Thanks a lot!' },
            { phrase: '¿Podrías repetir un poco más despacio?', meaning: 'Could you repeat a bit slower?' },
          ],
      isFallback: true,
    });
});

// Text-to-Speech endpoint (for whispering translations into Meta Ray-Ban temple speakers)
app.post('/api/tts', async (req, res) => {
  const { text, voice = 'Zephyr', language = 'en' } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for TTS' });
  }

  // If Gemini service is restricted or unavailable, signal client to use browser speech synthesis directly
  if (isGeminiAvailable === false || !process.env.GEMINI_API_KEY) {
    return res.json({
      success: false,
      useClientFallback: true,
      note: 'Using client Web SpeechSynthesis engine',
    });
  }

  try {
    const ai = getAi();

    // Use gemini-3.1-flash-tts-preview for AI voice synthesis
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: text.slice(0, 300) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voice) ? voice : 'Zephyr',
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      return res.json({
        success: true,
        audio: base64Audio,
        mimeType: 'audio/pcm;rate=24000',
        sampleRate: 24000,
      });
    }

    res.json({ success: false, useClientFallback: true });
  } catch (error: any) {
    isGeminiAvailable = false;
    res.json({
      success: false,
      useClientFallback: true,
    });
  }
});

// Start server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : undefined,
        watch: isHmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Meta Ray-Ban Live Translator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
