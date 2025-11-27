'use client'

import Image from 'next/image'
import { ITEMS } from '@blueprint3d/constants'
import { useI18n } from '../../providers/I18nProvider'

interface ItemsListProps {
  onItemSelect: (item: { name: string; model: string; type: string }) => void
}

export function ItemsList({ onItemSelect }: ItemsListProps) {
  const i18n = useI18n()
  const t = i18n.createT('items')

  return (
    <div className="grid grid-cols-4 gap-3">
      {ITEMS.map((item, index) => (
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
  )
}
