'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

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
  const t = useTranslations('saveDialog')
  const [name, setName] = useState(defaultName)

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
          <Button variant="default" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
