'use client'

import { useCallback, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from '../i18n/routing'
import { locales, languageMap } from '../i18n/routing'
import { I18nProvider } from '../providers/I18nProvider'
import type { I18nContext, TranslationFunction } from '../types/i18n'

/**
 * Adapter that bridges next-intl to Blueprint3D's i18n interface
 * This allows Blueprint3D components to work with next-intl without direct dependency
 */
export function Blueprint3DI18nAdapter({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  // Pre-create all translation functions for known namespaces
  // These hooks must be called at the top level
  const tSaveDialog = useTranslations('saveDialog')
  const tItems = useTranslations('items')
  const tFloorplanner = useTranslations('floorplanner')
  const tSidebar = useTranslations('sidebar')
  const tMyFloorplans = useTranslations('myFloorplans')
  const tSettings = useTranslations('settings')
  const tTextureSelector = useTranslations('textureSelector')
  const tContextMenu = useTranslations('contextMenu')
  const tMainControls = useTranslations('mainControls')

  // Map namespace to translation function
  const translationMap = useMemo(
    () => ({
      saveDialog: tSaveDialog,
      items: tItems,
      floorplanner: tFloorplanner,
      sidebar: tSidebar,
      myFloorplans: tMyFloorplans,
      settings: tSettings,
      textureSelector: tTextureSelector,
      contextMenu: tContextMenu,
      mainControls: tMainControls
    }),
    [tSaveDialog, tItems, tFloorplanner, tSidebar, tMyFloorplans, tSettings, tTextureSelector, tContextMenu, tMainControls]
  )

  // Create translation function factory
  const createT = useCallback(
    (namespace: string): TranslationFunction => {
      const tFunc = translationMap[namespace as keyof typeof translationMap]

      if (!tFunc) {
        console.warn(`Translation namespace "${namespace}" not found in Blueprint3D adapter`)
        return (key: string) => key
      }

      return (key: string, values?: Record<string, any>) => {
        return tFunc(key, values)
      }
    },
    [translationMap]
  )

  const setLocale = useCallback(
    (newLocale: string) => {
      router.replace(pathname, { locale: newLocale })
    },
    [router, pathname]
  )

  const i18nValue: I18nContext = useMemo(
    () => ({
      createT,
      locale,
      locales: locales as readonly string[],
      setLocale
    }),
    [createT, locale, setLocale]
  )

  return <I18nProvider value={i18nValue}>{children}</I18nProvider>
}

/**
 * Export languageMap for Settings component
 */
export { languageMap }
