import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide or display verified badge
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Installed PWA
      </span>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 active:scale-95 transition-all"
        title="Install Meta Ray-Ban Voice Bridge as native mobile PWA"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-900/50 transition-colors"
          title="Install on iOS Home Screen"
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span>Add to iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-sky-400" />
                  <h3 className="font-semibold text-slate-100">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="rounded-lg bg-sky-500/20 p-2 text-sky-400 shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-100 mb-0.5">Step 1: Tap Share</strong>
                    Tap the <strong>Share</strong> button at the bottom of Safari toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="rounded-lg bg-indigo-500/20 p-2 text-indigo-400 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-slate-100 mb-0.5">Step 2: Add to Home Screen</strong>
                    Scroll down the share sheet and tap <strong>Add to Home Screen</strong>.
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Enjoy fullscreen mobile subtitles, background Bluetooth audio sync with your Meta Ray-Ban glasses, and low-latency whisper translations!
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 active:scale-98 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Universal button if browser doesn't trigger beforeinstallprompt yet
  return (
    <button
      onClick={() => setShowIOSGuide(true)}
      className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
      title="Mobile launch instructions"
    >
      <Smartphone className="w-3.5 h-3.5 text-sky-400" />
      <span>Install PWA</span>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-400" />
                <h3 className="font-semibold text-slate-100">Launch on Mobile</h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowIOSGuide(false);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-slate-300">
              <p>
                <strong>Android Chrome:</strong> Tap the ⋮ three-dots menu and select <em>"Install App"</em> or <em>"Add to Home Screen"</em>.
              </p>
              <p>
                <strong>iPhone Safari:</strong> Tap the Share button (<Share2 className="w-3 h-3 inline text-sky-400" />) and tap <em>"Add to Home Screen"</em>.
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowIOSGuide(false);
              }}
              className="mt-5 w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </button>
  );
};
