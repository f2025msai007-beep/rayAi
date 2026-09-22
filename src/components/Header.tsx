import React from 'react';
import { GlassesDeviceState } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Glasses,
  Bluetooth,
  Battery,
  BatteryCharging,
  Maximize2,
  Sliders,
  Radio,
  Sparkles,
  Headphones
} from 'lucide-react';

interface Props {
  deviceState: GlassesDeviceState;
  onOpenBluetoothModal: () => void;
  onOpenHUD: () => void;
}

export const Header: React.FC<Props> = ({
  deviceState,
  onOpenBluetoothModal,
  onOpenHUD,
}) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 py-3 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* App Title & Identity */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-600/20 border border-sky-500/30 text-sky-400 shadow-md shadow-sky-500/10">
            <Glasses className="w-5 h-5" />
            {deviceState.connected && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-100 tracking-tight">
                Ray-Ban <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Live AI</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono text-sky-400/80 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                PWA v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>Real-Time Voice &amp; Bluetooth Subtitles</span>
            </p>
          </div>
        </div>

        {/* Right Tools: Glasses Device Badge, HUD, Install Button */}
        <div className="flex items-center gap-2">
          {/* Auto-Hear Mode Quick Pill */}
          <button
            onClick={onOpenBluetoothModal}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
              deviceState.autoHearMode === 'both'
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
                : deviceState.autoHearMode === 'foreign_only'
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
            title="Auto-Hear in Glasses status (click to configure in Bluetooth manager)"
          >
            <Headphones className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Auto-Hear: {deviceState.autoHearMode === 'both' ? 'Both' : deviceState.autoHearMode === 'foreign_only' ? 'Foreign' : 'Off'}
            </span>
          </button>

          {/* Glasses Status Pill (Tap to open Bluetooth manager) */}
          <button
            onClick={onOpenBluetoothModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
              deviceState.connected
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-sky-500/50'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="Meta Ray-Ban Connection & Audio Sync Settings"
          >
            <Bluetooth className={`w-3.5 h-3.5 ${deviceState.connected ? 'text-sky-400' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">
              {deviceState.connected ? 'Ray-Ban Meta' : 'Pair Glasses'}
            </span>
            {deviceState.connected && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono">
                {deviceState.batteryLevel}%
              </span>
            )}
          </button>

          {/* Fullscreen HUD Mode Button */}
          <button
            onClick={onOpenHUD}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Open OLED Teleprompter / HUD View"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline text-xs font-medium">HUD Mode</span>
          </button>

          {/* PWA In-App Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
