'use client'

import { useI18n } from '../../providers/I18nProvider'
import { Button } from '@/components/ui/button'
import { FilePlus, Save, Download, Upload, MoreVertical } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-media-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useRef } from 'react'

interface MainControlsProps {
  onNew: () => void
  onSave: () => void
  onDownload: () => void
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function MainControls({ onNew, onSave, onDownload, onLoad }: MainControlsProps) {
  const i18n = useI18n()
  const t = i18n.createT('mainControls')
  const isMobile = useIsMobile()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLoadClick = () => {
    fileInputRef.current?.click()
  }

  // Mobile: Compact menu with icons
  if (isMobile) {
    return (
      <div className="absolute top-3 left-3 flex gap-1.5">
        {/* Primary action: Save */}
        <Button
          onClick={onSave}
          variant="default"
          size="sm"
          className="bg-primary text-primary-foreground shadow-md"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {t('savePlan')}
        </Button>

        {/* Secondary actions in dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="shadow-md">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onNew}>
              <FilePlus className="h-4 w-4 mr-2" />
              {t('newPlan')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLoadClick}>
              <Upload className="h-4 w-4 mr-2" />
              {t('loadPlan')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              {t('downloadPlan')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onLoad}
          accept=".lumenfeng"
        />
      </div>
    )
  }

  // Desktop: Full buttons
  return (
    <div className="absolute top-5 left-5 flex gap-2">
      <Button onClick={onNew} variant="outline" size="sm">
        <FilePlus className="h-4 w-4 mr-1.5" />
        {t('newPlan')}
      </Button>
      <Button
        onClick={onSave}
        variant="default"
        size="sm"
        className="bg-primary text-primary-foreground"
      >
        <Save className="h-4 w-4 mr-1.5" />
        {t('savePlan')}
      </Button>
      <Button onClick={onDownload} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-1.5" />
        {t('downloadPlan')}
      </Button>
      <Button variant="outline" size="sm" asChild>
        <label className="cursor-pointer">
          <input type="file" className="hidden" onChange={onLoad} accept=".lumenfeng" />
          <Upload className="h-4 w-4 mr-1.5" />
          {t('loadPlan')}
        </label>
      </Button>
    </div>
  )
}
