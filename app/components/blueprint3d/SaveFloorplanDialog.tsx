'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '../../providers/I18nProvider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SaveFloorplanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
  defaultName?: string
}

export function SaveFloorplanDialog({
  open,
  onOpenChange,
  onSave,
  defaultName = ''
}: SaveFloorplanDialogProps) {
  const i18n = useI18n()
  const t = i18n.createT('saveDialog')
  const [name, setName] = useState(defaultName)

  // Update name when defaultName changes
  useEffect(() => {
    if (open) {
      setName(defaultName)
    }
  }, [open, defaultName])

  const handleSave = () => {
    if (name.trim()) {
      onSave(name)
      setName('')
      onOpenChange(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              {t('nameLabel')}
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('namePlaceholder')}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button variant="default" onClick={handleSave} disabled={!name.trim()}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
