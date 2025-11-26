'use client'

import { useEffect, useState } from 'react'
import { Trash2, Download, FolderOpen } from 'lucide-react'
import { getStorageService, FloorplanData } from '@src/services/storage'
import { useTranslations, useLocale } from 'next-intl'

interface MyFloorplansProps {
  onLoadFloorplan: (data: string) => void
}

export function MyFloorplans({ onLoadFloorplan }: MyFloorplansProps) {
  const t = useTranslations('myFloorplans')
  const locale = useLocale()
  const [floorplans, setFloorplans] = useState<FloorplanData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFloorplans()
  }, [])

  const loadFloorplans = async () => {
    try {
      const storage = getStorageService()
      const data = await storage.getAllFloorplans()
      setFloorplans(data)
    } catch (error) {
      console.error('Failed to load floorplans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoad = (floorplan: FloorplanData) => {
    onLoadFloorplan(floorplan.data)
  }

  const handleDownload = (floorplan: FloorplanData) => {
    const blob = new Blob([floorplan.data], { type: 'text' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${floorplan.name}.blueprint3d`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) {
      return
    }

    try {
      const storage = getStorageService()
      await storage.deleteFloorplan(id)
      await loadFloorplans()
    } catch (error) {
      console.error('Failed to delete floorplan:', error)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">{t('loading')}</div>
      </div>
    )
  }

  if (floorplans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noFloorplans')}</h3>
        <p className="text-sm text-gray-500">
          {t('saveFirst')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-4">
        {floorplans.length} saved {floorplans.length === 1 ? 'floorplan' : 'floorplans'}
      </div>

      {floorplans.map((floorplan) => (
        <div
          key={floorplan.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          {/* Thumbnail */}
          {floorplan.thumbnail && (
            <div className="mb-3 rounded overflow-hidden bg-gray-100">
              <img
                src={floorplan.thumbnail}
                alt={floorplan.name}
                className="w-full h-32 object-contain"
              />
            </div>
          )}

          {/* Title */}
          <h3 className="font-medium text-gray-900 mb-1 truncate">{floorplan.name}</h3>

          {/* Date */}
          <p className="text-xs text-gray-500 mb-3">
            {t('lastModified')}: {formatDate(floorplan.updatedAt)}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleLoad(floorplan)}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {t('loadButton')}
            </button>
            <button
              onClick={() => handleDownload(floorplan)}
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              title={t('downloadButton')}
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(floorplan.id)}
              className="px-3 py-1.5 text-sm bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
              title={t('deleteButton')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
