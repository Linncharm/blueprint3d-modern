'use client'

import Image from 'next/image'
import { FLOOR_TEXTURES, WALL_TEXTURES } from '@blueprint3d/constants'
import { useI18n } from '../../providers/I18nProvider'

interface TextureSelectorProps {
  type: 'floor' | 'wall' | null
  onTextureSelect: (textureUrl: string, stretch: boolean, scale: number) => void
}

export function TextureSelector({ type, onTextureSelect }: TextureSelectorProps) {
  const i18n = useI18n()
  const t = i18n.createT('textureSelector')

  if (!type) return null

  const textures = type === 'floor' ? FLOOR_TEXTURES : WALL_TEXTURES

  return (
    <div className="mx-5">
      <div className="border border-border rounded">
        <div className="bg-muted px-4 py-3 border-b border-border">
          <h3 className="font-medium">{type === 'floor' ? t('adjustFloor') : t('adjustWall')}</h3>
        </div>
        <div className="p-4 text-foreground">
          <div className="grid grid-cols-2 gap-3">
            {textures.map((texture, index) => (
              <button
                key={index}
                onClick={() => onTextureSelect(texture.url, texture.stretch, texture.scale)}
                className="relative aspect-square border border-border rounded hover:border-primary transition-colors overflow-hidden"
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
