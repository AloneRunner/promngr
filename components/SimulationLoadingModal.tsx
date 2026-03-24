import React, { useEffect } from 'react';
import { CheckCircle, Calendar } from 'lucide-react';

interface SimDoneResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

interface SimulationLoadingModalProps {
  isOpen: boolean;
  currentWeek: number;
  progress: number; // 0-100
  t: any;
  doneResult?: SimDoneResult | null;
  noMatchWeek?: boolean; // cup/empty week with no user match
  onDismiss?: () => void;
}

export default function SimulationLoadingModal({ isOpen, currentWeek, progress, t, doneResult, noMatchWeek, onDismiss }: SimulationLoadingModalProps) {
  if (!isOpen) return null;

  const isDone = !!doneResult;

  // Auto-dismiss after 1.5s when there's no user match
  useEffect(() => {
    if (noMatchWeek && !isDone) {
      const timer = setTimeout(() => { onDismiss?.(); }, 1500);
      return () => clearTimeout(timer);
    }
  }, [noMatchWeek, isDone]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 border border-gray-700 shadow-2xl">

        {isDone ? (
          /* ── DONE STATE: show match result ── */
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
              <CheckCircle className="w-9 h-9 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-sm mb-5">{currentWeek - 1}. Hafta Tamamlandı</p>

            {/* Score Card */}
            <div className="bg-slate-800/80 rounded-xl border border-slate-600/50 p-4 mb-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 text-right">
                  <div className="text-white font-bold text-sm leading-tight">{doneResult.homeTeam}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-2xl font-black text-white">{doneResult.homeScore}</span>
                  <span className="text-slate-500 font-bold">-</span>
                  <span className="text-2xl font-black text-white">{doneResult.awayScore}</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-bold text-sm leading-tight">{doneResult.awayTeam}</div>
                </div>
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all active:scale-95"
            >
              Devam
            </button>
          </div>

        ) : noMatchWeek ? (
          /* ── NO MATCH STATE: cup/empty week skip ── */
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-500/20 mb-4">
              <Calendar className="w-9 h-9 text-slate-400" />
            </div>
            <p className="text-white font-bold text-lg mb-1">{currentWeek - 1}. Hafta</p>
            <p className="text-slate-400 text-sm">Bu hafta oynayacak maçınız yok</p>
          </div>

        ) : (
          /* ── LOADING STATE ── */
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
                <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {t.simulatingWeek || 'Simulating Week'} {currentWeek}
              </h2>
              <p className="text-gray-400 text-sm">
                {t.pleaseWait || 'Please wait while matches are being processed...'}
              </p>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{t.progress || 'Progress'}</span>
                <span className="font-mono font-bold text-blue-400">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
