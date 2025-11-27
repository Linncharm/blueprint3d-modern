'use client'

import { useEffect, useState } from 'react'
import { Trash2, Download, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { getStorageService, FloorplanData } from '@blueprint3d/services/storage'
import { useI18n } from '../../providers/I18nProvider'
import { Button } from '@/components/ui/button'

interface MyFloorplansProps {
  onLoadFloorplan: (data: string) => void
}

export function MyFloorplans({ onLoadFloorplan }: MyFloorplansProps) {
  const i18n = useI18n()
  const t = i18n.createT('myFloorplans')
  const [floorplans, setFloorplans] = useState<FloorplanData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFloorplans()
  }, [])

  const loadFloorplans = async () => {
    try {
      // Always use remote storage (API)
      const storage = getStorageService(true)
      const data = await storage.getAllFloorplans()
      setFloorplans(data)
    } catch (error) {
      console.error('Failed to load floorplans:', error)
      // If user is not logged in or other errors, just show empty list
      // TODO: Show showcase floorplans for unauthenticated users
      setFloorplans([])
    } finally {
      setLoading(false)
    }
  }

  const handleLoad = async (id: string, name: string) => {
    const toastId = toast.loading(t('loadingItem', { name }))

    try {
      // Always use remote storage (API) to get the latest data
      const storage = getStorageService(true)
      const floorplan = await storage.getFloorplan(id)

      if (!floorplan) {
        toast.error(t('loadNotFound'), { id: toastId })
        return
      }

      onLoadFloorplan(JSON.stringify(floorplan.data))
      toast.success(t('loadedSuccess', { name }), { id: toastId })
    } catch (error) {
      console.error('Failed to load floorplan:', error)
      toast.error(t('loadError'), { id: toastId })
    }
  }

  const handleDownload = async (id: string, name: string) => {
    const toastId = toast.loading(t('downloadingItem', { name }))

    try {
      // Always use remote storage (API) to get the latest data
      const storage = getStorageService(true)
      const floorplan = await storage.getFloorplan(id)

      if (!floorplan) {
        toast.error(t('loadNotFound'), { id: toastId })
        return
      }

      const blob = new Blob([JSON.stringify(floorplan.data)], { type: 'text' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${floorplan.name}.lumenfeng`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(t('downloadSuccess', { name }), { id: toastId })
    } catch (error) {
      console.error('Failed to download floorplan:', error)
      toast.error(t('loadError'), { id: toastId })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('deleteConfirm'))) {
      return
    }

    const toastId = toast.loading(t('deletingItem', { name }))

    try {
      // Always use remote storage (API)
      const storage = getStorageService(true)
      await storage.deleteFloorplan(id)
      await loadFloorplans()
      toast.success(t('deleteSuccess', { name }), { id: toastId })
    } catch (error) {
      console.error('Failed to delete floorplan:', error)
      toast.error(t('deleteError') || 'Failed to delete floorplan', { id: toastId })
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString(i18n.locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">{t('loading')}</div>
      </div>
    )
  }

  if (floorplans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FolderOpen className="h-16 w-16 text-muted mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">{t('noFloorplans')}</h3>
        <p className="text-sm text-muted-foreground">{t('saveFirst')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-4">
        {t('savedCount', { count: floorplans.length })}
      </div>

      {floorplans.map((floorplan) => (
        <div
          key={floorplan.id}
          className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
        >
          {/* Thumbnail */}
          {floorplan.thumbnail && (
            <div className="mb-3 rounded overflow-hidden bg-muted">
              <img
                src={floorplan.thumbnail}
                alt={floorplan.name}
                className="w-full h-32 object-contain"
              />
            </div>
          )}

          {/* Title */}
          <h3 className="font-medium text-foreground mb-1 truncate">{floorplan.name}</h3>

          {/* Date */}
          <p className="text-xs text-muted-foreground mb-3">
            {t('lastModified')}: {formatDate(floorplan.updatedAt)}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleLoad(floorplan.id, floorplan.name)}
              size="sm"
              className="flex-1 gradient-background text-primary-foreground"
            >
              {t('loadButton')}
            </Button>
            <Button
              onClick={() => handleDownload(floorplan.id, floorplan.name)}
              size="sm"
              variant="outline"
              title={t('downloadButton')}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleDelete(floorplan.id, floorplan.name)}
              size="sm"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              title={t('deleteButton')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
