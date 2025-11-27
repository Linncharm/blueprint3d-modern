/**
 * I18n interfaces for Blueprint3D
 * These interfaces allow the component library to be agnostic of the actual i18n implementation
 */

/**
 * Translation function for a specific namespace
 */
export interface TranslationFunction {
  (key: string, values?: Record<string, any>): string
}

/**
 * I18n context interface
 * Provides translation functions and locale management
 */
export interface I18nContext {
  /**
   * Create a translation function for a specific namespace
   * @param namespace - The translation namespace (e.g., 'saveDialog', 'items')
   * @returns A translation function for that namespace
   */
  createT: (namespace: string) => TranslationFunction

  /**
   * Current locale
   */
  locale: string

  /**
   * Available locales
   */
  locales: readonly string[]

  /**
   * Change locale
   */
  setLocale: (locale: string) => void
}

/**
 * Router adapter interface
 * Abstracts routing functionality to make components router-agnostic
 */
export interface RouterAdapter {
  /**
   * Replace current route
   */
  replace: (path: string, options?: { locale?: string }) => void

  /**
   * Current pathname
   */
  pathname: string
}

/**
 * Language map for display purposes
 */
export type LanguageMap = Record<string, string>
