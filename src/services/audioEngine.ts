/**
 * Audio Engine for Meta Ray-Ban Smart Glasses
 * Manages Bluetooth audio routing, low-latency ear whispering,
 * PCM audio decoding for Gemini TTS, and live microphone analysis.
 */

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isUnlocked = false;

  private initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public async unlock(): Promise<boolean> {
    try {
      const ctx = this.initContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.isUnlocked = true;
      return true;
    } catch (err) {
      console.warn('AudioContext unlock failed:', err);
      return false;
    }
  }

  /**
   * Play Meta Ray-Ban connection chime or notification cue
   */
  public playCue(type: 'connect' | 'whisper_start' | 'mic_open' | 'haptic_tap'): void {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'connect') {
        // Double modern soft chime (like Ray-Ban Meta power-on)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'whisper_start') {
        // High soft blip indicating incoming whisper to glasses temple speaker
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1046.5, now); // C6
        osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'mic_open') {
        // Warm listening hum
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'haptic_tap') {
        // Subtle haptic thump
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {
      // Audio cue failure shouldn't break user flow
    }
  }

  /**
   * Decode Base64 PCM from Gemini TTS into AudioBuffer and play with Bluetooth sync delay
   */
  public async playGeminiPcm(
    base64Pcm: string,
    sampleRate = 24000,
    volume = 1.0,
    syncDelayMs = 0
  ): Promise<void> {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Decode base64 to 16-bit signed PCM
    const binary = atob(base64Pcm);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }

    const audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1.5, volume));

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    const startTime = ctx.currentTime + Math.max(0, syncDelayMs) / 1000;
    source.start(startTime);

    return new Promise((resolve) => {
      source.onended = () => resolve();
    });
  }

  private speechQueue: Array<() => Promise<void>> = [];
  private isProcessingSpeech = false;

  /**
   * High-reliability speech synthesis fallback (runs in browser, routes to glasses via Bluetooth)
   */
  public speakFallback(
    text: string,
    lang = 'en-US',
    volume = 1.0,
    syncDelayMs = 0,
    interrupt = false
  ): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve();
    }

    if (interrupt) {
      this.speechQueue = [];
      window.speechSynthesis.cancel();
    }

    return new Promise((resolve) => {
      const task = () =>
        new Promise<void>((taskResolve) => {
          setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.volume = Math.max(0.1, Math.min(1, volume));
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            // Try to pick natural system voice matching target language
            const voices = window.speechSynthesis.getVoices();
            const primaryCode = lang.toLowerCase().slice(0, 2);
            const exactMatch = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
            const langMatch = voices.find((v) => v.lang.toLowerCase().startsWith(primaryCode));
            const defaultVoice = voices.find((v) => v.default);

            if (exactMatch) {
              utterance.voice = exactMatch;
            } else if (langMatch) {
              utterance.voice = langMatch;
            } else if (defaultVoice) {
              utterance.voice = defaultVoice;
            }

            utterance.onend = () => {
              taskResolve();
              resolve();
            };
            utterance.onerror = (e) => {
              console.warn('Speech synthesis utterance error:', e);
              taskResolve();
              resolve();
            };

            window.speechSynthesis.speak(utterance);
          }, Math.max(0, syncDelayMs));
        });

      this.speechQueue.push(task);
      this.processSpeechQueue();
    });
  }

  private async processSpeechQueue() {
    if (this.isProcessingSpeech) return;
    this.isProcessingSpeech = true;

    while (this.speechQueue.length > 0) {
      const nextTask = this.speechQueue.shift();
      if (nextTask) {
        try {
          await nextTask();
        } catch (err) {
          console.warn('Speech queue execution error:', err);
        }
      }
    }

    this.isProcessingSpeech = false;
  }

  /**
   * Stop any ongoing speech
   */
  public stopSpeech(): void {
    this.speechQueue = [];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isProcessingSpeech = false;
  }

  /**
   * Hook up live MediaStream microphone analyzer to measure input levels
   */
  public attachMicStream(stream: MediaStream): AnalyserNode {
    const ctx = this.initContext();
    this.micStream = stream;
    this.micSourceNode = ctx.createMediaStreamSource(stream);
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 64;
    this.micSourceNode.connect(this.analyserNode);
    return this.analyserNode;
  }

  public getMicLevel(): number {
    if (!this.analyserNode) return 0;
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const avg = sum / data.length;
    // Map 0-255 to 0-100%
    return Math.min(100, Math.round((avg / 128) * 100));
  }

  public detachMic(): void {
    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }
    this.analyserNode = null;
  }
}

export const audioEngine = new AudioEngine();
