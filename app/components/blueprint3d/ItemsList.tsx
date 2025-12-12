'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { ITEMS, type ItemCategory } from '@blueprint3d/constants'
import { Blueprint3DMode, getModeConfig } from '@blueprint3d/config/modes'
import { useI18n } from '../../providers/I18nProvider'
import { Button } from '@/components/ui/button'

interface ItemsListProps {
  onItemSelect: (item: { name: string; model: string; type: string }) => void
  /** Application mode (string or enum) */
  mode?: Blueprint3DMode | string
}

const CATEGORY_KEYS = {
  all: 'all',
  bed: 'bed',
  drawer: 'drawer',
  wardrobe: 'wardrobe',
  light: 'light',
  storage: 'storage',
  table: 'table',
  chair: 'chair',
  sofa: 'sofa',
  armchair: 'armchair',
  stool: 'stool',
  door: 'door',
  window: 'window'
} as const

export function ItemsList({ onItemSelect, mode = Blueprint3DMode.NORMAL }: ItemsListProps) {
  const i18n = useI18n()
  const t = i18n.createT('items')

  // Get mode configuration
  const modeConfig = useMemo(() => getModeConfig(mode), [mode])

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all')

  // Build categories with translated labels based on allowed categories
  // Always add 'all' as the first category (UI filter, not a real category)
  const categories = useMemo(() => {
    const allCategory = {
      value: 'all' as const,
      label: t(`categories.${CATEGORY_KEYS.all}`)
    }
    const specificCategories = modeConfig.allowedCategories.map((value) => ({
      value,
      label: t(`categories.${CATEGORY_KEYS[value]}`)
    }))
    return [allCategory, ...specificCategories]
  }, [t, modeConfig.allowedCategories])

  // Filter items based on selected category and mode
  const filteredItems = useMemo(() => {
    let items = ITEMS

    // Filter by allowed categories in mode config
    items = items.filter((item) => modeConfig.allowedCategories.includes(item.category))

    // Then apply category filter
    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory)
    }

    return items
  }, [selectedCategory, modeConfig.allowedCategories])

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
            className="whitespace-nowrap"
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-4 gap-3">
        {filteredItems.map((item, index) => (
          <button
            key={index}
            onClick={() => onItemSelect(item)}
            className="border border-border rounded hover:border-primary transition-colors p-2 flex flex-col items-center gap-2 cursor-pointer bg-card"
          >
            <div className="relative w-full aspect-square">
              <Image
                src={item.image}
                alt={t(item.key)}
                fill
                sizes="(max-width: 768px) 25vw, 10vw"
                className="object-contain"
              />
            </div>
            <span className="text-xs text-center">{t(item.key)}</span>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No items found in this category
        </div>
      )}
    </div>
  )
}
