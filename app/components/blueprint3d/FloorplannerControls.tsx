'use client'

import { Move, Pencil, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface FloorplannerControlsProps {
  mode: 'move' | 'draw' | 'delete'
  onModeChange: (mode: 'move' | 'draw' | 'delete') => void
  onDone: () => void
}

export function FloorplannerControls({ mode, onModeChange, onDone }: FloorplannerControlsProps) {
  const t = useTranslations('floorplanner')

  return (
    <div className="absolute left-0 top-0 my-5 px-5 w-full">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === 'move' ? 'primary' : 'default'}
            onClick={() => onModeChange('move')}
            className={cn('flex items-center gap-2')}
          >
            <Move className="h-4 w-4" />
            {t('moveWalls')}
          </Button>
          <Button
            size="sm"
            variant={mode === 'draw' ? 'primary' : 'default'}
            onClick={() => onModeChange('draw')}
            className={cn('flex items-center gap-2')}
          >
            <Pencil className="h-4 w-4" />
            {t('drawWalls')}
          </Button>
          <Button
            size="sm"
            variant={mode === 'delete' ? 'primary' : 'default'}
            onClick={() => onModeChange('delete')}
            className={cn('flex items-center gap-2')}
          >
            <Trash2 className="h-4 w-4" />
            {t('deleteWalls')}
          </Button>
        </div>

        <Button size="sm" variant="primary" onClick={onDone}>
          {t('done')} &raquo;
        </Button>
      </div>
    </div>
  )
}
