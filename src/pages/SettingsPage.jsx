import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../hooks/useTranslation';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();
  const { t, currentLanguage, changeLanguage } = useTranslation();

  const [settings, setSettings] = useState({
    theme: 'light',
    language: currentLanguage,
    fontSize: 'medium'
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load user settings from localStorage
    const savedSettings = localStorage.getItem(`appearance_settings_${user?.id}`);
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  }, [user]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // If language is changed, update immediately
    if (key === 'language') {
      changeLanguage(value);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem(`appearance_settings_${user?.id}`, JSON.stringify(settings));
      
      // Apply theme changes immediately
      document.documentElement.setAttribute('data-theme', settings.theme);
      document.documentElement.style.fontSize = settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '18px' : '16px';
      
      // Update language
      changeLanguage(settings.language);
      
      showSuccessToast(t('settingsSaved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast(t('settingsSaveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const SettingCard = ({ icon, title, children }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{t('appearanceSettings')}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Appearance Settings */}
        <SettingCard icon={<Palette size={16} />} title={t('appearance')}>
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('theme')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={() => handleSettingChange('theme', 'light')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.theme === 'light'
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-8 rounded mb-2 bg-white border-gray-200`}></div>
                    <span className="text-sm font-medium text-gray-700">{t('light')}</span>
                  </button>
                  <button
                    onClick={() => handleSettingChange('theme', 'dark')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.theme === 'dark'
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-8 rounded mb-2 bg-gray-900 border-gray-700`}></div>
                    <span className="text-sm font-medium text-gray-700">{t('dark')}</span>
                  </button>
                  <button
                    onClick={() => handleSettingChange('theme', 'system')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.theme === 'system'
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-8 rounded mb-2 bg-gradient-to-r from-white to-gray-900 border-gray-400`}></div>
                    <span className="text-sm font-medium text-gray-700">{t('system')}</span>
                  </button>
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('language')}
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('fontSize')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={() => handleSettingChange('fontSize', 'small')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.fontSize === 'small'
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-sm font-medium text-gray-700 mb-1`}>Aa</div>
                    <span className="text-sm text-gray-600">{t('small')}</span>
                  </button>
                  <button
                    onClick={() => handleSettingChange('fontSize', 'medium')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.fontSize === 'medium'
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-base font-medium text-gray-700 mb-1`}>Aa</div>
                    <span className="text-sm text-gray-600">{t('medium')}</span>
                  </button>
                  <button
                    onClick={() => handleSettingChange('fontSize', 'large')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.fontSize === 'large'
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-lg font-medium text-gray-700 mb-1`}>Aa</div>
                    <span className="text-sm text-gray-600">{t('large')}</span>
                  </button>
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                {t('saving')}
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                {t('saveSettings')}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}