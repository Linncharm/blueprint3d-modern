'use client'

import { Move, Pencil, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '../../providers/I18nProvider'
import { useIsMobile } from '@/hooks/use-media-query'

interface FloorplannerControlsProps {
  mode: 'move' | 'draw' | 'delete'
  onModeChange: (mode: 'move' | 'draw' | 'delete') => void
  onDone: () => void
}

export function FloorplannerControls({ mode, onModeChange, onDone }: FloorplannerControlsProps) {
  const i18n = useI18n()
  const t = i18n.createT('floorplanner')
  const isMobile = useIsMobile()

  return (
    <div className={cn('absolute left-0 top-0 w-full', isMobile ? 'my-3 px-3' : 'my-5 px-5')}>
      <div className="flex items-center justify-between">
        <div className={cn('flex', isMobile ? 'gap-1' : 'gap-2')}>
          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant={mode === 'move' ? 'secondary' : 'default'}
            onClick={() => onModeChange('move')}
            className={cn(!isMobile && 'flex items-center gap-2', isMobile && 'h-9 w-9 shadow-md')}
            title={isMobile ? t('moveWalls') : undefined}
          >
            <Move className="h-4 w-4" />
            {!isMobile && t('moveWalls')}
          </Button>
          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant={mode === 'draw' ? 'secondary' : 'default'}
            onClick={() => onModeChange('draw')}
            className={cn(!isMobile && 'flex items-center gap-2', isMobile && 'h-9 w-9 shadow-md')}
            title={isMobile ? t('drawWalls') : undefined}
          >
            <Pencil className="h-4 w-4" />
            {!isMobile && t('drawWalls')}
          </Button>
          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant={mode === 'delete' ? 'secondary' : 'default'}
            onClick={() => onModeChange('delete')}
            className={cn(!isMobile && 'flex items-center gap-2', isMobile && 'h-9 w-9 shadow-md')}
            title={isMobile ? t('deleteWalls') : undefined}
          >
            <Trash2 className="h-4 w-4" />
            {!isMobile && t('deleteWalls')}
          </Button>
        </div>

        <Button
          size={isMobile ? 'sm' : 'sm'}
          variant="secondary"
          onClick={onDone}
          className={cn(isMobile && 'shadow-md')}
        >
          {isMobile ? (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              {t('done')}
            </>
          ) : (
            <>
              {t('done')} &raquo;
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
