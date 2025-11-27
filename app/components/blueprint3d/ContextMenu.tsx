'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useI18n } from '../../providers/I18nProvider'
import type { Item } from '@blueprint3d/items/item'

import { Configuration, configDimUnit } from '@blueprint3d/core/configuration'

interface ContextMenuProps {
  selectedItem: Item | null
  onDelete: () => void
  onResize: (height: number, width: number, depth: number) => void
  onFixedChange: (fixed: boolean) => void
}

export function ContextMenu({ selectedItem, onDelete, onResize, onFixedChange }: ContextMenuProps) {
  console.log({ selectedItem })
  const i18n = useI18n()
  const t = i18n.createT('contextMenu')
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [depth, setDepth] = useState(0)
  const [fixed, setFixed] = useState(false)
  const [currentUnit, setCurrentUnit] = useState('inch')

  // Convert cm to display unit
  const cmToDisplay = (cm: number, unit: string): number => {
    switch (unit) {
      case 'inch':
        return cm / 2.54
      case 'm':
        return cm / 100
      case 'cm':
        return cm
      case 'mm':
        return cm * 10
      default:
        return cm / 2.54
    }
  }

  // Convert display unit to cm
  const displayToCm = (value: number, unit: string): number => {
    switch (unit) {
      case 'inch':
        return value * 2.54
      case 'm':
        return value * 100
      case 'cm':
        return value
      case 'mm':
        return value / 10
      default:
        return value * 2.54
    }
  }

  // Get unit label
  const getUnitLabel = (unit: string): string => {
    switch (unit) {
      case 'inch':
        return t('units.inches')
      case 'm':
        return t('units.meters')
      case 'cm':
        return t('units.centimeters')
      case 'mm':
        return t('units.millimeters')
      default:
        return t('units.inches')
    }
  }

  // Get decimal places for unit
  const getDecimalPlaces = (unit: string): number => {
    switch (unit) {
      case 'inch':
        return 0
      case 'm':
        return 2
      case 'cm':
        return 1
      case 'mm':
        return 0
      default:
        return 0
    }
  }

  useEffect(() => {
    // Get current unit from Configuration
    const unit = Configuration.getStringValue(configDimUnit)
    setCurrentUnit(unit)

    if (selectedItem) {
      const decimals = getDecimalPlaces(unit)
      setWidth(Number(cmToDisplay(selectedItem.getWidth(), unit).toFixed(decimals)))
      setHeight(Number(cmToDisplay(selectedItem.getHeight(), unit).toFixed(decimals)))
      setDepth(Number(cmToDisplay(selectedItem.getDepth(), unit).toFixed(decimals)))
      setFixed(selectedItem.fixed || false)
    }
  }, [selectedItem])

  const handleResize = (field: 'width' | 'height' | 'depth', value: number) => {
    const newWidth = field === 'width' ? value : width
    const newHeight = field === 'height' ? value : height
    const newDepth = field === 'depth' ? value : depth

    if (field === 'width') setWidth(value)
    if (field === 'height') setHeight(value)
    if (field === 'depth') setDepth(value)

    onResize(
      displayToCm(newHeight, currentUnit),
      displayToCm(newWidth, currentUnit),
      displayToCm(newDepth, currentUnit)
    )
  }

  const handleFixedChange = (checked: boolean) => {
    setFixed(checked)
    onFixedChange(checked)
  }

  if (!selectedItem) {
    return null
  }

  return (
    <div className="mx-5">
      <span className="text-lg font-semibold">{selectedItem.metadata?.itemName}</span>
      <br />
      <br />
      <Button
        variant={'destructive'}
        className="w-full flex items-center justify-center gap-2"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
        {t('deleteItem')}
      </Button>
      <br />
      <div className="border border-border rounded">
        <div className="bg-muted px-4 py-3 border-b border-border">
          <h3 className="font-medium">{t('adjustSize')}</h3>
        </div>
        <div className="p-4 text-foreground">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="w-20 text-sm">{t('width')}</label>
              <Input
                type="number"
                value={width}
                onChange={(e) => handleResize('width', Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-20 text-sm">{t('depth')}</label>
              <Input
                type="number"
                value={depth}
                onChange={(e) => handleResize('depth', Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-20 text-sm">{t('height')}</label>
              <Input
                type="number"
                value={height}
                onChange={(e) => handleResize('height', Number(e.target.value))}
              />
            </div>
          </div>
          <small className="text-muted-foreground text-xs mt-3 block">
            {t('measurementsIn')} {getUnitLabel(currentUnit)}.
          </small>
        </div>
      </div>

      <label className="flex items-center gap-2 mt-4 cursor-pointer">
        <Checkbox checked={fixed} onCheckedChange={handleFixedChange} />
        <span className="text-sm">{t('lockInPlace')}</span>
      </label>
    </div>
  )
}
