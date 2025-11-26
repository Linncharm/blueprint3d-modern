'use client'

import { useState, useEffect, useTransition } from 'react'
import { Settings as SettingsIcon, Languages } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { locales, languageMap } from '@/i18n/routing'

interface SettingsProps {
  onUnitChange?: (unit: string) => void
}

export function Settings({ onUnitChange }: SettingsProps) {
  const t = useTranslations('settings')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [selectedUnit, setSelectedUnit] = useState('inch')
  const [selectedLanguage, setSelectedLanguage] = useState(locale)

  // Load saved unit from localStorage on mount
  useEffect(() => {
    const savedUnit = localStorage.getItem('dimensionUnit')
    if (savedUnit) {
      setSelectedUnit(savedUnit)
    }
  }, [])

  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit)
    // Save to localStorage
    localStorage.setItem('dimensionUnit', unit)
    // Notify parent component
    onUnitChange?.(unit)
  }

  const handleLanguageChange = (newLocale: string) => {
    setSelectedLanguage(newLocale)
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
  }

  const units = [
    { value: 'inch', label: t('units.inch.label'), description: t('units.inch.description') },
    { value: 'm', label: t('units.m.label'), description: t('units.m.description') },
    { value: 'cm', label: t('units.cm.label'), description: t('units.cm.description') },
    { value: 'mm', label: t('units.mm.label'), description: t('units.mm.description') },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="flex items-center gap-3 text-gray-800 mb-6">
        <SettingsIcon className="h-7 w-7" />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      <div className="space-y-8">
        {/* Language Settings */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Languages className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">{t('language')}</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('languageDescription')}
          </p>

          <div className="space-y-3">
            {locales.map((lang) => (
              <label
                key={lang}
                className="flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all"
                style={{
                  borderColor: selectedLanguage === lang ? '#3b82f6' : '#e5e7eb',
                  backgroundColor: selectedLanguage === lang ? '#eff6ff' : 'white',
                }}
              >
                <input
                  type="radio"
                  name="language"
                  value={lang}
                  checked={selectedLanguage === lang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="mt-1.5 w-4 h-4"
                  disabled={isPending}
                />
                <div className="flex-1">
                  <div className="font-semibold text-base text-gray-900">{t(`languages.${lang}`)}</div>
                  <div className="text-sm text-gray-600 mt-1">{languageMap[lang as keyof typeof languageMap]}</div>
                </div>
                {selectedLanguage === lang && (
                  <div className="text-blue-600 font-medium text-sm mt-1.5">✓ {t('active')}</div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Dimension Unit Settings */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{t('dimensionUnit')}</h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('dimensionUnitDescription')}
          </p>
        </div>

        <div className="space-y-3">
          {units.map((unit) => (
            <label
              key={unit.value}
              className="flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all"
              style={{
                borderColor: selectedUnit === unit.value ? '#3b82f6' : '#e5e7eb',
                backgroundColor: selectedUnit === unit.value ? '#eff6ff' : 'white',
              }}
            >
              <input
                type="radio"
                name="dimensionUnit"
                value={unit.value}
                checked={selectedUnit === unit.value}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="mt-1.5 w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-semibold text-base text-gray-900">{unit.label}</div>
                <div className="text-sm text-gray-600 mt-1">{unit.description}</div>
              </div>
              {selectedUnit === unit.value && (
                <div className="text-blue-600 font-medium text-sm mt-1.5">✓ {t('active')}</div>
              )}
            </label>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-sm text-blue-900">
            <strong>{t('currentSelection')}:</strong> {units.find(u => u.value === selectedUnit)?.label}
          </p>
          <p className="text-sm text-blue-700 mt-2">
            {t('appliesTo')}
          </p>
          <ul className="text-sm text-blue-700 mt-1 ml-4 list-disc">
            <li>{t('applies2dFloorplan')}</li>
            <li>{t('applies3dDimensions')}</li>
            <li>{t('appliesAllDimensions')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
