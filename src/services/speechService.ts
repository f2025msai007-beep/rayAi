/**
 * Real-time Speech Recognition Service
 * Interfaces with Web Speech API for live transcription and interim subtitle streaming.
 * Includes Voice Activity Detection (VAD) silence auto-commit and continuous hands-free listening.
 */

type InterimCallback = (text: string, isFinal: boolean) => void;
type ErrorCallback = (error: string) => void;
type StatusCallback = (status: 'idle' | 'listening' | 'speaking' | 'translating') => void;

class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private shouldKeepListening = false;
  private currentLanguage = 'en-US';
  private onInterim: InterimCallback | null = null;
  private onError: ErrorCallback | null = null;
  private onStatus: StatusCallback | null = null;
  private activeStream: MediaStream | null = null;
  private silenceTimer: any = null;
  private lastSpokenText = '';
  private isWhisperActive = false;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  public setWhisperActive(active: boolean): void {
    this.isWhisperActive = active;
    if (active) {
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
    }
  }

  public setStatusCallback(callback: StatusCallback | null): void {
    this.onStatus = callback;
  }

  public setLanguage(speechCode: string): void {
    const validCode = speechCode === 'auto' ? 'en-US' : speechCode;
    this.currentLanguage = validCode;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.lang = validCode;
      } catch (e) {
        // Ignored
      }
    }
  }

  public async startListening(
    speechCode: string,
    onResult: InterimCallback,
    onError: ErrorCallback,
    onStatus?: StatusCallback
  ): Promise<boolean> {
    this.onInterim = onResult;
    this.onError = onError;
    if (onStatus) this.onStatus = onStatus;

    const validCode = speechCode === 'auto' ? 'en-US' : speechCode;
    this.currentLanguage = validCode;
    this.shouldKeepListening = true;
    this.isWhisperActive = false;

    // First, request microphone permissions (this also opens Bluetooth HFP microphone profile on iOS / Android)
    try {
      if (!this.activeStream) {
        this.activeStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }
    } catch (micErr: any) {
      console.warn('Microphone permission request:', micErr);
    }

    if (!this.isSupported()) {
      onError('Speech Recognition is not natively supported in this browser. You can use Simulated Audio or type spoken text.');
      return false;
    }

    const SpeechRecClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch (e) {}
      }

      this.recognition = new SpeechRecClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = validCode;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStatus) this.onStatus('listening');
      };

      this.recognition.onresult = (event: any) => {
        // If glasses are currently playing whisper in ear, discard incoming speech to avoid echo loop
        if (this.isWhisperActive) {
          return;
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const candidateText = (finalTranscript || interimTranscript).trim();
        if (!candidateText) return;

        if (this.onStatus) this.onStatus('speaking');

        // Clear existing silence timer
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        // If browser provided final transcript, commit immediately
        if (finalTranscript.trim() && this.onInterim) {
          const textToCommit = finalTranscript.trim();
          if (textToCommit !== this.lastSpokenText) {
            this.lastSpokenText = textToCommit;
            if (this.onStatus) this.onStatus('translating');
            this.onInterim(textToCommit, true);
          }
          return;
        }

        // If interim transcript received, stream it to display
        if (interimTranscript.trim() && this.onInterim) {
          this.onInterim(interimTranscript.trim(), false);

          // Hands-free VAD: If speaker stops talking for 850ms, auto-commit as final utterance
          this.silenceTimer = setTimeout(() => {
            const currentPending = interimTranscript.trim();
            if (currentPending && currentPending !== this.lastSpokenText && !this.isWhisperActive) {
              this.lastSpokenText = currentPending;
              if (this.onStatus) this.onStatus('translating');
              if (this.onInterim) {
                this.onInterim(currentPending, true);
              }
            }
          }, 850);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        console.warn('Speech recognition event error:', event.error);
        if (this.onError) {
          this.onError(`Microphone issue: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // Auto restart if user didn't explicitly pause hands-free mode
        if (this.shouldKeepListening) {
          setTimeout(() => {
            if (this.shouldKeepListening && !this.isListening) {
              try {
                this.recognition.start();
              } catch (e) {
                // Ignore restart race condition
              }
            }
          }, 250);
        } else {
          if (this.onStatus) this.onStatus('idle');
        }
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      if (this.onError) {
        this.onError(err.message || 'Failed to start speech recognition');
      }
      return false;
    }
  }

  public stopListening(): void {
    this.shouldKeepListening = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    if (this.onStatus) this.onStatus('idle');
  }

  public getActiveStream(): MediaStream | null {
    return this.activeStream;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechService = new SpeechService();
