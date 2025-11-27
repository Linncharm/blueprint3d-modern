'use client'

import { Blueprint3DI18nAdapter } from '@/adapters/blueprint3d-i18n-adapter'
import { Blueprint3DAppBase } from './Blueprint3DAppBase'

/**
 * Blueprint3D App for standalone submodule
 * This component wraps the base Blueprint3DApp with i18n adapter (next-intl)
 */
export function Blueprint3DApp() {
  return (
    <Blueprint3DI18nAdapter>
      <Blueprint3DAppBase />
    </Blueprint3DI18nAdapter>
  )
}

export default Blueprint3DApp
