import React, { useState } from 'react';
import { Settings, Volume2, VolumeX, Zap, BarChart3, Globe, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  performanceSettings: {
    showAnimations: boolean;
    detailedStats: boolean;
    backgroundSimulation: boolean;
    autoSave: 'ALWAYS' | 'WEEKLY' | 'MONTHLY';
  };
  onSettingsChange: (settings: any) => void;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  t: any; // Translation object
}

export default function SettingsModal({
  isOpen,
  onClose,
  performanceSettings,
  onSettingsChange,
  currentLanguage,
  onLanguageChange,
  t
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState(performanceSettings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'id', name: 'Indonesia', flag: '🇮🇩' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">{t.settings || 'Settings'}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Performance Settings */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              {t.performance || 'Performance'}
            </h3>
            <div className="space-y-4">
              {/* Show Animations */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 opacity-60">
                <div>
                  <div className="font-medium text-white flex items-center gap-2">
                    {t.showAnimations || 'Show Animations'}
                    <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">🔜 {t.comingSoon || 'Coming Soon'}</span>
                  </div>
                  <div className="text-sm text-gray-400">{t.showAnimationsDesc || 'Display match animations and effects'}</div>
                </div>
                <button
                  onClick={() => setLocalSettings({ ...localSettings, showAnimations: !localSettings.showAnimations })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    localSettings.showAnimations ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  disabled
                >
                  <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    localSettings.showAnimations ? 'translate-x-7' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Detailed Stats */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 opacity-60">
                <div>
                  <div className="font-medium text-white flex items-center gap-2">
                    {t.detailedStats || 'Detailed Statistics'}
                    <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">🔜 {t.comingSoon || 'Coming Soon'}</span>
                  </div>
                  <div className="text-sm text-gray-400">{t.detailedStatsDesc || 'Show detailed player and match statistics'}</div>
                </div>
                <button
                  onClick={() => setLocalSettings({ ...localSettings, detailedStats: !localSettings.detailedStats })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    localSettings.detailedStats ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  disabled
                >
                  <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    localSettings.detailedStats ? 'translate-x-7' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Background Simulation */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                  <div className="font-medium text-white">{t.backgroundSimulation || 'Background Simulation'}</div>
                  <div className="text-sm text-gray-400">{t.backgroundSimulationDesc || 'Show loading screen during week simulation (recommended for mobile)'}</div>
                </div>
                <button
                  onClick={() => setLocalSettings({ ...localSettings, backgroundSimulation: !localSettings.backgroundSimulation })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    localSettings.backgroundSimulation ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    localSettings.backgroundSimulation ? 'translate-x-7' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Auto Save */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Save className="w-4 h-4 text-green-400" />
                  <div className="font-medium text-white">{t.autoSave || 'Auto Save'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['ALWAYS', 'WEEKLY', 'MONTHLY'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setLocalSettings({ ...localSettings, autoSave: option })}
                      className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        localSettings.autoSave === option
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {option === 'ALWAYS' ? t.always || 'Always' :
                       option === 'WEEKLY' ? t.weekly || 'Weekly' :
                       t.monthly || 'Monthly'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              {t.language || 'Language'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange(lang.code)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    currentLanguage === lang.code
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{lang.flag}</div>
                  <div className="font-medium">{lang.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Performance Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>💡 {t.tip || 'Tip'}:</strong> {t.performanceSettingsTip || 'If you experience slow performance, disable animations and enable background simulation. This will significantly improve speed on mobile devices.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900/95 p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            {t.cancel || 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            {t.save || 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
