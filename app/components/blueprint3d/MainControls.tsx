'use client'

import { useTranslations } from 'next-intl'

interface MainControlsProps {
  onNew: () => void
  onSave: () => void
  onDownload: () => void
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function MainControls({ onNew, onSave, onDownload, onLoad }: MainControlsProps) {
  const t = useTranslations('mainControls')

  return (
    <div className="absolute top-5 left-5 flex gap-2">
      <button
        onClick={onNew}
        className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        {t('newPlan')}
      </button>
      <button
        onClick={onSave}
        className="px-3 py-1.5 text-sm bg-blue-600 text-white border border-blue-600 rounded hover:bg-blue-700 transition-colors"
      >
        {t('savePlan')}
      </button>
      <button
        onClick={onDownload}
        className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        {t('downloadPlan')}
      </button>
      <label className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer">
        <input
          type="file"
          className="hidden"
          onChange={onLoad}
          accept=".blueprint3d"
        />
        {t('loadPlan')}
      </label>
    </div>
  )
}
