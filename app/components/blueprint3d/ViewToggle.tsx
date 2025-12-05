'use client'

import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'

interface ViewToggleProps {
  viewMode: '2d' | '3d'
  onViewChange: (mode: '2d' | '3d') => void
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  const isMobile = useIsMobile()

  return (
    <div
      className={cn(
        'absolute flex gap-1 bg-card border border-border rounded overflow-hidden shadow-md',
        isMobile ? 'top-3 right-3' : 'top-5 right-5'
      )}
    >
      <button
        onClick={() => onViewChange('3d')}
        className={cn(
          'transition-colors',
          isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-sm',
          viewMode === '3d'
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-foreground hover:bg-accent'
        )}
      >
        3D
      </button>
      <button
        onClick={() => onViewChange('2d')}
        className={cn(
          'transition-colors',
          isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-sm',
          viewMode === '2d'
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-foreground hover:bg-accent'
        )}
      >
        2D
      </button>
    </div>
  )
}
