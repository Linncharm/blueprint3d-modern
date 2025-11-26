'use client'

import Image from 'next/image'
import { ITEMS } from '@src/constants'
import { useTranslations } from 'next-intl'

interface ItemsListProps {
  onItemSelect: (item: { name: string; model: string; type: string }) => void
}

export function ItemsList({ onItemSelect }: ItemsListProps) {
  const t = useTranslations('items')

  return (
    <div className="grid grid-cols-4 gap-3">
      {ITEMS.map((item, index) => (
        <button
          key={index}
          onClick={() => onItemSelect(item)}
          className="border border-gray-200 rounded hover:border-blue-500 transition-colors p-2 flex flex-col items-center gap-2 cursor-pointer bg-white"
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
