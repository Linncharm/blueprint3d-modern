'use client'

import { ZoomIn, ZoomOut, Home, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '../ui/Button'

interface CameraControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function CameraControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onMoveLeft,
  onMoveRight,
  onMoveUp,
  onMoveDown
}: CameraControlsProps) {
  return (
    <div className="absolute bottom-5 right-0 pr-5 flex items-end gap-3">
      <div className="flex items-end gap-1">
        <Button size="sm" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={onResetView}>
          <Home className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-end gap-1">
        <Button size="sm" onClick={onMoveLeft}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col gap-0">
          <Button size="sm" onClick={onMoveUp} className="rounded-b-none">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onMoveDown} className="rounded-t-none">
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm" onClick={onMoveRight}>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
