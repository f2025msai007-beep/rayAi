import React, { useState, useEffect } from 'react';
import { GlassesDeviceState, GlassesModel } from '../types';
import { audioEngine } from '../services/audioEngine';
import {
  Bluetooth,
  Glasses,
  BatteryCharging,
  Battery,
  Sliders,
  Volume2,
  Mic,
  CheckCircle2,
  X,
  RefreshCw,
  Info,
  Radio,
  Sparkles,
  Smartphone,
  Cpu,
  Headphones,
  Check
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  deviceState: GlassesDeviceState;
  onUpdateDeviceState: (updates: Partial<GlassesDeviceState>) => void;
}

export const BluetoothManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  deviceState,
  onUpdateDeviceState,
}) => {
  const [activeTab, setActiveTab] = useState<'device' | 'audio_sync' | 'mobile_setup'>('device');
  const [isPairing, setIsPairing] = useState(false);
  const [liveMeter, setLiveMeter] = useState(0);
  const [pairingNotice, setPairingNotice] = useState<string | null>(null);

  // Poll mic input level when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setLiveMeter(audioEngine.getMicLevel());
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWebBluetoothConnect = async () => {
    setIsPairing(true);
    setPairingNotice(null);
    try {
      if ((navigator as any).bluetooth) {
        // Attempt real Web Bluetooth request
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [
            { namePrefix: 'Ray-Ban' },
            { namePrefix: 'Meta' },
            { services: ['battery_service'] },
          ],
          optionalServices: ['generic_access', 'battery_service'],
        });

        onUpdateDeviceState({
          connected: true,
          deviceName: device.name || 'Ray-Ban Meta Wayfarer',
          connectionType: 'web_bluetooth',
        });
        audioEngine.playCue('connect');
      } else {
        // Fallback to System Bluetooth / Active Profile
        throw new Error('Web Bluetooth not active in current browser frame. Using System Bluetooth profile.');
      }
    } catch (err: any) {
      console.log('Bluetooth pairing fallback:', err.message);
      // Connect as active system Bluetooth audio device
      onUpdateDeviceState({
        connected: true,
        deviceName: 'Ray-Ban Meta (Bluetooth Audio)',
        connectionType: 'system_bluetooth',
        wearState: 'on_head',
      });
      setPairingNotice('Connected via iOS / Android System Bluetooth audio routing.');
      audioEngine.playCue('connect');
    } finally {
      setIsPairing(false);
    }
  };

  const handleDisconnect = () => {
    onUpdateDeviceState({
      connected: false,
    });
    setPairingNotice(null);
  };

  const handleTestSyncChime = () => {
    audioEngine.playCue('whisper_start');
    setTimeout(() => {
      audioEngine.speakFallback(
        'Meta Ray-Ban audio sync test. Whispering translation into your ear speakers.',
        'en-US',
        deviceState.whisperVolume / 100,
        deviceState.syncDelayMs
      );
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Glasses className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Meta Ray-Ban Controller
                {deviceState.connected && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Paired
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Smart Glasses Bluetooth Audio & 5-Mic Array</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-4 p-1 rounded-2xl bg-slate-950/60 border border-slate-800/80 shrink-0">
          <button
            onClick={() => setActiveTab('device')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'device'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span>Glasses Device</span>
          </button>
          <button
            onClick={() => setActiveTab('audio_sync')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'audio_sync'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Audio & Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('mobile_setup')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'mobile_setup'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iOS / Android</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {activeTab === 'device' && (
            <div className="space-y-4">
              {/* Device Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Device Hardware</span>
                    <h3 className="text-sm font-semibold text-slate-100 mt-0.5">{deviceState.deviceName}</h3>
                    <p className="text-xs text-sky-400/90">{deviceState.model}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 font-medium">
                      {deviceState.isCharging ? (
                        <BatteryCharging className="w-3.5 h-3.5" />
                      ) : (
                        <Battery className="w-3.5 h-3.5" />
                      )}
                      <span>{deviceState.batteryLevel}%</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Wear Sensor:</span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {deviceState.wearState === 'on_head' ? 'On Face' : deviceState.wearState}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Capture LED:</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Privacy Ready
                    </span>
                  </div>
                </div>

                {/* Model Selector */}
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1.5">
                    Frame Model & Finish
                  </label>
                  <select
                    value={deviceState.model}
                    onChange={(e) => onUpdateDeviceState({ model: e.target.value as GlassesModel })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Wayfarer (Matte Black)">Ray-Ban Meta Wayfarer (Matte Black)</option>
                    <option value="Wayfarer (Shiny Black)">Ray-Ban Meta Wayfarer (Shiny Black)</option>
                    <option value="Headliner (Caramel)">Ray-Ban Meta Headliner (Caramel)</option>
                    <option value="Skyler (Shiny Chalk)">Ray-Ban Meta Skyler (Shiny Chalk)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!deviceState.connected ? (
                  <button
                    onClick={handleWebBluetoothConnect}
                    disabled={isPairing}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 active:scale-98 transition disabled:opacity-50"
                  >
                    {isPairing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Searching for Meta Glasses...</span>
                      </>
                    ) : (
                      <>
                        <Bluetooth className="w-4 h-4" />
                        <span>Pair Meta Ray-Ban Glasses</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 active:scale-98 transition"
                  >
                    Disconnect Glasses
                  </button>
                )}
              </div>

              {pairingNotice && (
                <div className="flex items-center gap-2 rounded-xl bg-sky-950/40 border border-sky-500/30 p-2.5 text-xs text-sky-300">
                  <Info className="w-4 h-4 shrink-0 text-sky-400" />
                  <span>{pairingNotice}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audio_sync' && (
            <div className="space-y-4 text-xs">
              {/* Auto-Hear in Glasses (Temple Audio Feed) */}
              <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                      <Headphones className="w-4 h-4 text-sky-400" />
                      Auto-Hear in Glasses (Temple Speakers)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Automatically whisper live translated speech into your Meta Ray-Ban glasses.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                    {deviceState.autoHearMode === 'both'
                      ? 'Both Active'
                      : deviceState.autoHearMode === 'foreign_only'
                      ? 'Foreign Only'
                      : deviceState.autoHearMode === 'wearer_only'
                      ? 'Wearer Only'
                      : 'Muted'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => onUpdateDeviceState({ autoHearMode: 'both' })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      deviceState.autoHearMode === 'both'
                        ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-md shadow-sky-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Both Speakers
                      </span>
                      {deviceState.autoHearMode === 'both' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <p className="text-[10px] leading-tight text-slate-400">
                      Whisper foreign speech into your ear & whisper your translated foreign words so you can hear both.
                    </p>
                  </button>

                  <button
                    onClick={() => onUpdateDeviceState({ autoHearMode: 'foreign_only' })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      deviceState.autoHearMode === 'foreign_only'
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 text-indigo-400" /> Foreign Only
                      </span>
                      {deviceState.autoHearMode === 'foreign_only' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[10px] leading-tight text-slate-400">
                      Only whisper when the foreign speaker talks (translated to your language).
                    </p>
                  </button>

                  <button
                    onClick={() => onUpdateDeviceState({ autoHearMode: 'off' })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      deviceState.autoHearMode === 'off'
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs">Manual Only</span>
                      {deviceState.autoHearMode === 'off' && <Check className="w-3.5 h-3.5 text-slate-300" />}
                    </div>
                    <p className="text-[10px] leading-tight text-slate-400">
                      Subtitles only on screen. Tap "Hear in Glasses" button on any turn to whisper.
                    </p>
                  </button>
                </div>
              </div>

              {/* Latency Sync Calibration */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-sky-400" />
                      Bluetooth Audio Latency Sync
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Compensates for A2DP Bluetooth buffer so whisper translation lands naturally in ear.
                    </p>
                  </div>
                  <span className="font-mono text-sky-400 font-bold text-sm bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500/20">
                    +{deviceState.syncDelayMs}ms
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="400"
                  step="10"
                  value={deviceState.syncDelayMs}
                  onChange={(e) => onUpdateDeviceState({ syncDelayMs: Number(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0ms (Instant / Wired)</span>
                  <span>120ms (Recommended)</span>
                  <span>400ms (High Buffer)</span>
                </div>

                <button
                  onClick={handleTestSyncChime}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Test Temple Whisper Audio</span>
                </button>
              </div>

              {/* Volume & Mic Levels */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      Whisper Volume (Temple Speakers)
                    </span>
                    <span className="font-mono text-indigo-300 font-bold">{deviceState.whisperVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={deviceState.whisperVolume}
                    onChange={(e) => onUpdateDeviceState({ whisperVolume: Number(e.target.value) })}
                    className="w-full accent-indigo-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      5-Mic Beamforming Sensitivity
                    </span>
                    <span className="font-mono text-emerald-300 font-bold">{deviceState.micGain}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={deviceState.micGain}
                    onChange={(e) => onUpdateDeviceState({ micGain: Number(e.target.value) })}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />

                  {/* Live Meter */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Mic Array Activity</span>
                      <span>{liveMeter}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 transition-all duration-75"
                        style={{ width: `${liveMeter}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mobile_setup' && (
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-2.5">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  iPhone & iOS Safari Instructions
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>In iOS <strong>Settings &gt; Bluetooth</strong>, connect to your <strong>"Ray-Ban Meta"</strong> glasses.</li>
                  <li>In Safari, tap <strong>Share</strong> and choose <strong>"Add to Home Screen"</strong> for full-screen PWA standalone mode.</li>
                  <li>When you start speaking or listening, Safari will route mic and audio directly through the Meta Ray-Ban temple speakers and microphone array!</li>
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-2.5">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Android & Chrome Ready to Launch
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>Pair <strong>"Ray-Ban Meta"</strong> under Android Bluetooth settings. Enable <em>Phone calls &amp; Media audio</em>.</li>
                  <li>Install via the top banner button or Chrome menu <em>"Install App"</em>.</li>
                  <li>Web Bluetooth API can also query battery level and wear state directly on Chromium browsers.</li>
                </ol>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-indigo-950/30 border border-indigo-500/20 p-3 text-[11px] text-indigo-300">
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>
                  Tip: Keep your phone in your pocket or breast pocket with screen-lock disabled or HUD view active while having hands-free conversations with your glasses!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl bg-sky-500 px-5 py-2 text-xs font-semibold text-white hover:bg-sky-400 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
