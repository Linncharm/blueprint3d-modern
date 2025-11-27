'use client'

import { DefaultI18nProvider, defaultLanguageMap } from './providers/DefaultI18nProvider'
import { Blueprint3DAppBase } from './components/blueprint3d/Blueprint3DAppBase'

/**
 * Standalone Blueprint3D App
 * This demonstrates how to use Blueprint3D independently without next-intl
 */
export function App() {
  return (
    <DefaultI18nProvider>
      <Blueprint3DAppBase />
    </DefaultI18nProvider>
  )
}

export default App
