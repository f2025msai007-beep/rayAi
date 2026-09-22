import React, { useState } from 'react';
import { TranslationTurn } from '../types';
import { X, Copy, Check, Download, BookOpen, Share2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  turns: TranslationTurn[];
}

export const ConversationSummaryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  turns,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    let md = `# Meta Ray-Ban Conversation Transcript\nDate: ${new Date().toLocaleDateString()}\n\n`;
    turns.forEach((turn, idx) => {
      const speaker = turn.speaker === 'glasses_wearer' ? '👓 Wearer' : '🗣️ Foreign Speaker';
      const time = new Date(turn.timestamp).toLocaleTimeString();
      md += `### ${idx + 1}. ${speaker} (${time})\n`;
      md += `**Original (${turn.sourceLang}):** ${turn.originalText}\n\n`;
      md += `**Translation (${turn.targetLang}):** ${turn.translatedText}\n\n`;
      if (turn.phonetic) md += `*Phonetic:* ${turn.phonetic}\n\n`;
      if (turn.culturalNote) md += `*Note:* ${turn.culturalNote}\n\n`;
      md += `---\n\n`;
    });
    return md;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([generateMarkdown()], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `ray-ban-translation-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Conversation Transcript</h3>
              <p className="text-xs text-slate-400">{turns.length} conversational turns recorded</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="my-4 overflow-y-auto flex-1 space-y-3 pr-1 text-xs">
          {turns.length === 0 ? (
            <p className="text-slate-400 py-8 text-center">No conversation lines recorded yet.</p>
          ) : (
            turns.map((turn, i) => (
              <div key={turn.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="font-semibold text-slate-300">
                    {turn.speaker === 'glasses_wearer' ? '👓 Wearer' : '🗣️ Foreign Speaker'}
                  </span>
                  <span>{new Date(turn.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-300 italic">"{turn.originalText}"</p>
                <p className="font-medium text-sky-300">{turn.translatedText}</p>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={handleCopy}
            disabled={turns.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 active:scale-98 transition disabled:opacity-40"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Markdown' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={turns.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-500 text-xs font-semibold text-white hover:bg-sky-400 active:scale-98 transition disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Save .md File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
