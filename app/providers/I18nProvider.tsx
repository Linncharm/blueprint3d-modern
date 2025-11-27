'use client'

import { createContext, useContext } from 'react'
import type { I18nContext } from '../types/i18n'

/**
 * I18n Context for Blueprint3D components
 * This context is provider-agnostic and can be implemented with any i18n library
 */
const I18nContextInstance = createContext<I18nContext | null>(null)

/**
 * Hook to access i18n context
 * @throws Error if used outside of I18nProvider
 */
export function useI18n(): I18nContext {
  const context = useContext(I18nContextInstance)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

/**
 * I18n Provider component
 * Provides i18n context to all child components
 */
export function I18nProvider({
  children,
  value
}: {
  children: React.ReactNode
  value: I18nContext
}) {
  return <I18nContextInstance.Provider value={value}>{children}</I18nContextInstance.Provider>
}
