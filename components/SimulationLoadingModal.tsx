import React from 'react';

interface SimulationLoadingModalProps {
  isOpen: boolean;
  currentWeek: number;
  progress: number; // 0-100
  t: any; // Translation object
}

export default function SimulationLoadingModal({ isOpen, currentWeek, progress, t }: SimulationLoadingModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
            <svg 
              className="w-8 h-8 text-blue-400 animate-spin" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t.simulatingWeek || 'Simulating Week'} {currentWeek}
          </h2>
          <p className="text-gray-400 text-sm">
            {t.pleaseWait || 'Please wait while matches are being processed...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
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

        {/* Info Text */}
        <div className="space-y-2">
          <div className="flex items-center text-gray-400 text-sm">
            <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{t.simulatingLeagueMatches || 'Simulating league matches...'}</span>
          </div>
          {progress > 33 && (
            <div className="flex items-center text-gray-400 text-sm">
              <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{t.simulatingCupMatches || 'Simulating cup matches...'}</span>
            </div>
          )}
          {progress > 66 && (
            <div className="flex items-center text-gray-400 text-sm">
              <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{t.updatingStatistics || 'Updating player statistics...'}</span>
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-xs text-center">
            💡 {t.performanceTip || 'Tip: You can disable animations in Settings for faster simulation'}
          </p>
        </div>
      </div>
    </div>
  );
}
