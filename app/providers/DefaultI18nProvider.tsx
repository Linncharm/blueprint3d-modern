'use client'

import { useState, useCallback, useMemo } from 'react'
import { I18nProvider } from './I18nProvider'
import type { I18nContext, TranslationFunction } from '../types/i18n'
import enTranslations from '../messages/en.json'

/**
 * Default I18n Provider for standalone Blueprint3D usage
 * This provides a simple translation system without external dependencies
 */
export function DefaultI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState('en')

  // Translation data
  const translations: Record<string, any> = {
    en: enTranslations
    // Add more languages as needed
  }

  // Get nested value from object using dot notation
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // Simple template string replacement
  const interpolate = (template: string, values?: Record<string, any>): string => {
    if (!values) return template

    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return values[key]?.toString() || match
    })
  }

  // Create translation function for a namespace
  const createT = useCallback(
    (namespace: string): TranslationFunction => {
      return (key: string, values?: Record<string, any>): string => {
        const currentTranslations = translations[locale] || translations['en']
        const namespacedTranslations = currentTranslations[namespace]

        if (!namespacedTranslations) {
          console.warn(`Translation namespace "${namespace}" not found`)
          return key
        }

        const translation = getNestedValue(namespacedTranslations, key)

        if (translation === undefined) {
          console.warn(`Translation key "${namespace}.${key}" not found for locale "${locale}"`)
          return key
        }

        return interpolate(translation, values)
      }
    },
    [locale, translations]
  )

  const handleSetLocale = useCallback((newLocale: string) => {
    setLocale(newLocale)
  }, [])

  const i18nValue: I18nContext = useMemo(
    () => ({
      createT,
      locale,
      locales: ['en'] as const, // Add more as translations are added
      setLocale: handleSetLocale
    }),
    [createT, locale, handleSetLocale]
  )

  return <I18nProvider value={i18nValue}>{children}</I18nProvider>
}

/**
 * Default language map for Settings component
 */
export const defaultLanguageMap = {
  en: 'English',
  zh: '简体中文',
  tw: '繁體中文'
}
