'use client'

import Image from 'next/image'
import { FLOOR_TEXTURES, WALL_TEXTURES } from '@src/constants'
import { useTranslations } from 'next-intl'

interface TextureSelectorProps {
  type: 'floor' | 'wall' | null
  onTextureSelect: (textureUrl: string, stretch: boolean, scale: number) => void
}

export function TextureSelector({ type, onTextureSelect }: TextureSelectorProps) {
  const t = useTranslations('textureSelector')

  if (!type) return null

  const textures = type === 'floor' ? FLOOR_TEXTURES : WALL_TEXTURES

  return (
    <div className="mx-5">
      <div className="border border-gray-200 rounded">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium">{type === 'floor' ? t('adjustFloor') : t('adjustWall')}</h3>
        </div>
        <div className="p-4 text-gray-900">
          <div className="grid grid-cols-2 gap-3">
            {textures.map((texture, index) => (
              <button
                key={index}
                onClick={() => onTextureSelect(texture.url, texture.stretch, texture.scale)}
                className="border border-gray-200 rounded hover:border-blue-500 transition-colors overflow-hidden relative aspect-square"
              >
                <Image
                  src={texture.thumbnail}
                  alt={texture.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
