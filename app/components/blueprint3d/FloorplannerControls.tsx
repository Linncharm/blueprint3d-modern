'use client'

import { Move, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '../../providers/I18nProvider'

interface FloorplannerControlsProps {
  mode: 'move' | 'draw' | 'delete'
  onModeChange: (mode: 'move' | 'draw' | 'delete') => void
  onDone: () => void
}

export function FloorplannerControls({ mode, onModeChange, onDone }: FloorplannerControlsProps) {
  const i18n = useI18n()
  const t = i18n.createT('floorplanner')

  return (
    <div className="absolute left-0 top-0 my-5 px-5 w-full">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === 'move' ? 'secondary' : 'default'}
            onClick={() => onModeChange('move')}
            className={cn('flex items-center gap-2')}
          >
            <Move className="h-4 w-4" />
            {t('moveWalls')}
          </Button>
          <Button
            size="sm"
            variant={mode === 'draw' ? 'secondary' : 'default'}
            onClick={() => onModeChange('draw')}
            className={cn('flex items-center gap-2')}
          >
            <Pencil className="h-4 w-4" />
            {t('drawWalls')}
          </Button>
          <Button
            size="sm"
            variant={mode === 'delete' ? 'secondary' : 'default'}
            onClick={() => onModeChange('delete')}
            className={cn('flex items-center gap-2')}
          >
            <Trash2 className="h-4 w-4" />
            {t('deleteWalls')}
          </Button>
        </div>

        <Button size="sm" variant="secondary" onClick={onDone}>
          {t('done')} &raquo;
        </Button>
      </div>
    </div>
  )
}
